import type { AthleteProfile } from '@/core/athlete/AthleteProfile'
import {
  getAvailableMinutes,
  hasPoolAccess,
  resolveDesiredRestDays,
  resolveRestDates,
  type Availability,
} from '@/core/availability/Availability'
import { STIMULUS_PRIORITY_ORDER, toSessionPriority } from '@/core/coaching/stimulusPriority'
import type { SessionRequirement } from '@/core/coaching/sessionRequirement'
import type { PlannedSession, SessionPriority } from '@/core/training/PlannedSession'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import { analyzeLimiters } from '@/sports/triathlon/coaching/limiterAnalysis'
import {
  computeWeeklyTrainingBudget,
  generateWeeklySessionRequirements,
} from '@/sports/triathlon/coaching/weeklyStimulusComposer'
import { getFamilyForSession } from '@/sports/triathlon/coaching/workoutFamilies'
import type { DateISO } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { instantiateSessionTemplate } from '../sessions'
import { pickBestFittingTemplate } from './pickTemplate'
import { getSessionTier, getWeekLoadMultiplier } from './progressionCurve'

export interface BuildWeekSessionsInput {
  weekStart: DateISO
  /** Days on/after this date are excluded — keeps sessions from ever landing on or after the race. */
  planEndDateExclusive: DateISO
  phase: TrainingPhaseName
  weekIndexInPhase: number
  /** How many weeks this phase spans in total — drives the load curve
   * (progressive overload + deload cycle within a phase, descending taper).
   * Defaults to a full 4-week cycle when omitted. */
  weeksInPhase?: number
  weekId: string
  availability: Availability
  /**
   * Required for Training Intelligence V2's limiter-aware composition (see
   * `sports/triathlon/coaching/weeklyStimulusComposer.ts`) — without it,
   * every athlete gets the identical secondary-touch rotation regardless
   * of their own declared swim/bike/run levels.
   */
  athleteProfile: AthleteProfile
}

/** Below this, a "session" would be too short to be worth prescribing. */
const MIN_VIABLE_SESSION_MINUTES = 15

type DayWithMinutes = { date: DateISO; minutes: number; pool: boolean }

/**
 * Where each requirement actually lands (day + real catalog template) —
 * kept together through placement so the post-pass recovery-conflict
 * resolver (`resolveRecoveryConflicts`) can reason about what's adjacent
 * to what without re-deriving anything.
 */
interface Placement {
  requirement: SessionRequirement
  day: DayWithMinutes
}

const PRIORITY_RANK = new Map(STIMULUS_PRIORITY_ORDER.map((p, i) => [p, i]))

/**
 * Claims days for a list of requirements from a shared, mutable pool —
 * most important first, and within equal importance, whichever requirement
 * needs the most time first (brief V2.1 §7: a requirement with a large
 * `preferredDurationMin` needs a big day *first*, before smaller sessions
 * claim it for no real reason — the exact problem that used to starve the
 * brick slot down to a 30min transition drill).
 */
function claimDays(requirements: SessionRequirement[], pool: DayWithMinutes[]): Map<SessionRequirement, DayWithMinutes> {
  const claimed = new Map<SessionRequirement, DayWithMinutes>()
  const ordered = [...requirements].sort((a, b) => {
    const rankDiff = (PRIORITY_RANK.get(a.priority) ?? 99) - (PRIORITY_RANK.get(b.priority) ?? 99)
    if (rankDiff !== 0) return rankDiff
    return b.preferredDurationMin - a.preferredDurationMin
  })
  for (const requirement of ordered) {
    const day = pool.shift()
    if (day) claimed.set(requirement, day)
  }
  return claimed
}

/**
 * Places every requirement on a real day — pool access is a genuine
 * constraint (brief V2.1 §8), not a priority hack: requirements that need
 * it are solved as their own sub-problem, against only the pool-accessible
 * days, *before* everything else is placed against what's left. This
 * replaces V2's single global "swim always goes first" rank hack, which
 * only worked because nothing else ever needed a resource-based
 * constraint; the two-phase shape here generalizes to a future
 * indoor-trainer/track/open-water constraint without changing shape.
 */
function placeRequirements(
  requirements: SessionRequirement[],
  daysWithMinutes: DayWithMinutes[],
): Map<SessionRequirement, DayWithMinutes> {
  const pool = [...daysWithMinutes]
  const [poolRequired, unconstrained] = [
    requirements.filter((r) => r.requiresPoolAccess),
    requirements.filter((r) => !r.requiresPoolAccess),
  ]

  const poolDays = pool.filter((d) => d.pool)
  const poolClaims = claimDays(poolRequired, poolDays)
  for (const day of poolClaims.values()) {
    const index = pool.indexOf(day)
    if (index !== -1) pool.splice(index, 1)
  }

  const otherClaims = claimDays(unconstrained, pool)

  return new Map([...poolClaims, ...otherClaims])
}

/**
 * A single, bounded repair pass for adjacent-day recovery conflicts (brief
 * V2.1 §13) — not a full constraint solver (deliberately: brief §13 itself
 * warns against "blindly implementing universal rules"). Two *placed*
 * sessions on calendar-adjacent days whose families name each other in
 * `incompatibleNeighbors`, both above `fatigueCost: 'low'`, are a real
 * conflict (e.g. a hard bike the day before a key run). When found, the
 * lower-priority of the pair is swapped with another placement's day if
 * that swap removes the conflict without creating a new one — otherwise
 * the conflict is left in place (documented limitation, not silently
 * hidden) rather than the placement looping indefinitely chasing a perfect
 * schedule.
 */
function resolveRecoveryConflicts(placements: Placement[]): Placement[] {
  const result = [...placements]
  const dayMs = (date: DateISO) => new Date(date).getTime()
  const oneDayMs = 24 * 60 * 60 * 1000

  const isConflict = (a: Placement, b: Placement): boolean => {
    if (Math.abs(dayMs(a.day.date) - dayMs(b.day.date)) !== oneDayMs) return false
    if (a.requirement.fatigueCost === 'low' || b.requirement.fatigueCost === 'low') return false
    return (
      a.requirement.incompatibleFamilies.includes(b.requirement.familyId) ||
      b.requirement.incompatibleFamilies.includes(a.requirement.familyId)
    )
  }

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i]!
      const b = result[j]!
      if (!isConflict(a, b)) continue

      // Prefer moving whichever of the pair is lower priority (higher
      // PRIORITY_RANK index = less important) to a third placement's day,
      // provided that day doesn't create a new conflict for either side.
      // Never touches a pool-constrained placement on either end of the
      // swap — that assignment already solved a hard constraint (brief
      // §8), and an unconditional swap here could silently put swim on a
      // day without pool access.
      const [mover, anchor] =
        (PRIORITY_RANK.get(a.requirement.priority) ?? 0) >= (PRIORITY_RANK.get(b.requirement.priority) ?? 0)
          ? [a, b]
          : [b, a]
      if (mover.requirement.requiresPoolAccess) continue

      const swapCandidate = result.find((p) => {
        if (p === mover || p === anchor) return false
        if (p.requirement.requiresPoolAccess) return false
        const wouldConflictWithAnchor = Math.abs(dayMs(p.day.date) - dayMs(anchor.day.date)) === oneDayMs
        return !wouldConflictWithAnchor
      })

      // Both directions must still fit their own requirement's minimum
      // effective duration after the swap — a repair that fixes a
      // recovery conflict by producing an unusably short session for
      // someone else is not an improvement.
      if (
        swapCandidate &&
        swapCandidate.day.minutes >= mover.requirement.minimumEffectiveDurationMin &&
        mover.day.minutes >= swapCandidate.requirement.minimumEffectiveDurationMin
      ) {
        const moverDay = mover.day
        mover.day = swapCandidate.day
        swapCandidate.day = moverDay
      }
    }
  }

  return result
}

export function buildWeekSessions(input: BuildWeekSessionsInput): PlannedSession[] {
  const {
    weekStart,
    planEndDateExclusive,
    phase,
    weekIndexInPhase,
    weeksInPhase = 4,
    weekId,
    availability,
    athleteProfile,
  } = input

  // Where this week sits on its phase's load curve — see
  // progressionCurve.ts for the periodization rationale (progressive
  // overload within a block, a deload week, a descending taper).
  const loadMultiplier = getWeekLoadMultiplier(phase, weekIndexInPhase, weeksInPhase)
  const tier = getSessionTier(loadMultiplier)

  // Computed once per week — see limiterAnalysis.ts. Cheap, pure, and the
  // single input that makes the Weekly Composer's discipline frequency and
  // secondary-touch rotation athlete-aware instead of identical for every
  // triathlete regardless of their own declared swim/bike/run levels
  // (Training Intelligence V2).
  const limiterAnalysis = analyzeLimiters(athleteProfile)

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (date) => date < planEndDateExclusive,
  )

  // Explicit rest day(s) always win — never scheduled, whatever their
  // declared availability says. Falls back to the old "pick whichever
  // day(s) have the least time" heuristic only when no explicit choice
  // exists (old data, or none of the chosen weekdays fall in this
  // particular week). Excluding explicit rest dates from the pool *before*
  // computing the count ceiling is what prevents an already-unavailable
  // day from being double-counted against a separately-desired rest day.
  const explicitRestDates = resolveRestDates(availability, weekDates)
  const restDaysPerWeek =
    explicitRestDates.size > 0 ? explicitRestDates.size : resolveDesiredRestDays(availability)
  const maxTrainingDays = Math.max(0, weekDates.length - restDaysPerWeek)

  const daysWithMinutes: DayWithMinutes[] = weekDates
    .filter((date) => !explicitRestDates.has(date))
    .map((date) => ({
      date,
      minutes: getAvailableMinutes(availability, date),
      pool: hasPoolAccess(availability, date),
    }))
    .filter((d) => d.minutes >= MIN_VIABLE_SESSION_MINUTES)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, maxTrainingDays)

  // --- Composition: decide WHAT is required (Training Intelligence V2.1) ---
  // See weeklyStimulusComposer.ts's module comment for what this replaces.
  // Neither this function nor anything it calls decides frequency from here
  // on — it only places what the composer already decided.
  const budget = computeWeeklyTrainingBudget(daysWithMinutes, phase, tier)
  const requirements = generateWeeklySessionRequirements({
    weekIndexInPhase,
    weeksInPhase,
    tier,
    budget,
    limiterAnalysis,
  })

  // --- Placement: decide WHEN each requirement can happen ---
  const dayByRequirement = placeRequirements(requirements, daysWithMinutes)

  let placements: Placement[] = requirements
    .map((requirement) => {
      const day = dayByRequirement.get(requirement)
      return day ? { requirement, day } : undefined
    })
    .filter((p): p is Placement => p !== undefined)

  placements = resolveRecoveryConflicts(placements)

  const sessions: PlannedSession[] = []
  for (const { requirement, day } of placements) {
    // Strength forces the lighter catalog tier in specific/taper (never
    // requested at all in race — see the composer), protecting recovery
    // capacity for the triathlon-specific work those phases exist for
    // (brief §10/§21: strength consumes recovery budget, it is not free
    // additional volume) — matching `strength-maintenance`'s own
    // objective text.
    const effectiveTier =
      requirement.discipline === 'strength' && (phase === 'specific' || phase === 'taper') ? 'reduced' : tier

    const template = pickBestFittingTemplate(requirement.discipline, requirement.sessionType, day.minutes, {
      tier: effectiveTier,
      rotationKey: weekIndexInPhase,
    })
    if (!template) continue

    // A requirement whose actual placed template — after every fallback
    // degradation `pickBestFittingTemplate` already tries — still lands
    // below that template's *own* family's minimum effective duration no
    // longer delivers a real stimulus of any kind (brief V2.1 §7): drop it
    // rather than schedule a token session (brief §26: no filler).
    // Deliberately re-derived from the *template actually chosen* rather
    // than the original requirement's family: a requirement that
    // gracefully degraded to an easier, shorter-but-still-valid family
    // (e.g. threshold → endurance) must be judged against what it actually
    // became, not what it started as.
    const actualFamily = getFamilyForSession(requirement.discipline, template.sessionType)
    if (actualFamily && template.estimatedDurationMin < actualFamily.minimumEffectiveDurationMin) continue

    // A slot only earns "key" if it actually delivers the anchor stimulus.
    // When time constraints degraded it all the way to a recovery-tier
    // session, calling it "key" would contradict the explanation shown to
    // the athlete (brief §51: cohérence sportive first).
    const mappedPriority = toSessionPriority(requirement.priority)
    const priority: SessionPriority =
      mappedPriority === 'key' && template.sessionType === 'recovery' ? 'secondary' : mappedPriority

    sessions.push(instantiateSessionTemplate(template, { date: day.date, weekId, priority }))
  }

  return sessions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
