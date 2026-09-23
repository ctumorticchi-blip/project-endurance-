import type { AthleteProfile } from '@/core/athlete/AthleteProfile'
import {
  getAvailableMinutes,
  hasPoolAccess,
  resolveDesiredRestDays,
  resolveRestDates,
  type Availability,
} from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import { analyzeLimiters } from '@/sports/triathlon/coaching/limiterAnalysis'
import type { DateISO, Discipline } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { instantiateSessionTemplate } from '../sessions'
import { pickBestFittingTemplate } from './pickTemplate'
import { getSessionTier, getWeekLoadMultiplier } from './progressionCurve'
import {
  applyBrickInsertion,
  applyLimiterSwimTouch,
  getSecondaryType,
  PRIMARY_BRICK_TYPE_BY_PHASE,
  PRIMARY_SESSION_TYPE_BY_PHASE,
  shouldInsertBrick,
  shouldInsertLimiterSwimTouch,
  WEEKLY_SLOT_DISCIPLINES,
  WEEKLY_SLOT_PRIORITIES,
} from './weeklySlots'

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
  // single input that makes the secondary-touch rotation below athlete-aware
  // instead of identical for every triathlete regardless of their own
  // declared swim/bike/run levels (Training Intelligence V2).
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

  const daysWithMinutes = weekDates
    .filter((date) => !explicitRestDates.has(date))
    .map((date) => ({
      date,
      minutes: getAvailableMinutes(availability, date),
      pool: hasPoolAccess(availability, date),
    }))
    .filter((d) => d.minutes >= MIN_VIABLE_SESSION_MINUTES)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, maxTrainingDays)

  const numDays = daysWithMinutes.length
  let disciplines: Discipline[] = WEEKLY_SLOT_DISCIPLINES[Math.min(numDays, 7)] ?? []

  if (shouldInsertBrick(phase, weekIndexInPhase, numDays)) {
    disciplines = applyBrickInsertion(disciplines)
  }

  if (shouldInsertLimiterSwimTouch(phase, limiterAnalysis)) {
    disciplines = applyLimiterSwimTouch(disciplines, limiterAnalysis)
  }

  // How many times each discipline has already been *assigned a session*
  // so far this week — read before, and updated after, each slot decision,
  // so "occurrence 0" reliably means "this discipline's anchor session".
  const occurrenceByDiscipline = new Map<Discipline, number>()
  // Days not yet claimed by a slot. A shared, mutable pool rather than a
  // fixed slot-index -> day mapping: when the swim slot has to skip ahead
  // to grab a pool day out of order, that day is properly removed here, so
  // no later slot can collide with it — and the day it would otherwise have
  // taken stays in the pool for a later slot instead of being silently
  // dropped (which used to leave one day of the week with no session at
  // all, looking like an extra, unrequested rest day).
  const remainingDays = [...daysWithMinutes]
  const sessions: PlannedSession[] = []

  // Days are otherwise claimed strictly in slot-array order, which causes
  // two distinct problems once a slot needs something a plain `shift()`
  // (take whichever day currently has the most remaining minutes) doesn't
  // account for:
  //
  //  1. Brick needs far more time than an ordinary secondary touch, but
  //     `applyBrickInsertion` places it wherever a secondary run/bike
  //     touch happened to sit (often the very last slot) — by which point
  //     only the two lowest-availability days remain, never enough for
  //     even the shortest brick template. It silently degraded to a 30min
  //     transition drill every time (found reviewing the Gold Standard
  //     plan, brief §34).
  //  2. Swim needs a day with pool access specifically, not just any day —
  //     it already has its own pool-seeking search below, but that search
  //     only sees whatever days *other* slots haven't already claimed via
  //     plain `shift()`. With two pool days and only one swim occurrence
  //     this was invisible (one spare pool day was always enough), but
  //     giving a limiter-swim athlete a second weekly swim touch exposed
  //     it: a *key* run/bike slot processed first could still shift() away
  //     one of the two pool days before either swim slot got a turn,
  //     leaving swim's second occurrence with no pool day to find and
  //     silently rerouting it to bike/run instead.
  //
  // Both need first claim on the day pool ahead of ordinary secondary/
  // optional slots — swim ahead of everything (it only ever claims a
  // pool-having day, or falls back gracefully when none remain, so
  // letting it go first never costs bike/run a day they actually need),
  // brick right after the key anchors. `Array#sort` is stable, so this
  // only pulls swim/brick forward; the relative order of every other slot
  // (and therefore each discipline's occurrence count) is unchanged.
  const dayAssignmentRank = (slot: number): number => {
    if (disciplines[slot] === 'swim') return 0
    if (WEEKLY_SLOT_PRIORITIES[slot] === 'key') return 1
    if (disciplines[slot] === 'brick') return 2
    return 3
  }
  const slotOrder = disciplines.map((_, slot) => slot).sort((a, b) => dayAssignmentRank(a) - dayAssignmentRank(b))

  for (const slot of slotOrder) {
    const discipline = disciplines[slot]!
    const priority = WEEKLY_SLOT_PRIORITIES[slot] ?? 'optional'

    let day: (typeof daysWithMinutes)[number] | undefined
    let effectiveDiscipline: Discipline = discipline
    let effectiveOccurrence = occurrenceByDiscipline.get(discipline) ?? 0

    if (discipline === 'swim') {
      const poolIndex = remainingDays.findIndex((d) => d.pool)
      if (poolIndex !== -1) {
        day = remainingDays.splice(poolIndex, 1)[0]
      } else if (remainingDays.length > 0) {
        // No pool access anywhere this week: don't waste this day's time —
        // give it to whichever of bike/run has had the fewer sessions so far.
        day = remainingDays.shift()
        const bikeCount = occurrenceByDiscipline.get('bike') ?? 0
        const runCount = occurrenceByDiscipline.get('run') ?? 0
        effectiveDiscipline = runCount <= bikeCount ? 'run' : 'bike'
        effectiveOccurrence = runCount <= bikeCount ? runCount : bikeCount
      }
    } else {
      day = remainingDays.shift()
    }

    if (!day) continue
    occurrenceByDiscipline.set(effectiveDiscipline, effectiveOccurrence + 1)

    const preferredType =
      effectiveDiscipline === 'bike' || effectiveDiscipline === 'run' || effectiveDiscipline === 'swim'
        ? effectiveOccurrence === 0
          ? PRIMARY_SESSION_TYPE_BY_PHASE[phase][effectiveDiscipline]
          : getSecondaryType(phase, effectiveDiscipline, weekIndexInPhase, tier, limiterAnalysis)
        : effectiveDiscipline === 'brick'
          ? PRIMARY_BRICK_TYPE_BY_PHASE[phase]
          : effectiveDiscipline === 'strength'
            ? 'strength'
            : undefined

    // Strength had no `preferredType` at all until this fix (coaching
    // defect found reviewing the Gold Standard plan, brief §21: every
    // single week of all 16, base through taper, got the identical 20min
    // maintenance circuit — `pickBestFittingTemplate` was falling straight
    // through to "shortest template of the discipline that fits" with an
    // empty type chain, which the two-template strength catalog always
    // resolves to `strength-maintenance`). Base/build should get the full
    // `strength-general` stimulus (tier-aware, degrading to maintenance on
    // this week's own deload/minimal tier like everything else); specific/
    // taper/race force the lighter tier regardless, protecting recovery
    // capacity for the triathlon-specific work those phases exist for
    // (brief §21: "strength consumes recovery capacity, do not treat it as
    // free additional volume") — matching `strength-maintenance`'s own
    // objective text, unreachable before this fix.
    const effectiveTier: typeof tier =
      effectiveDiscipline === 'strength' && (phase === 'specific' || phase === 'taper' || phase === 'race')
        ? 'reduced'
        : tier

    const template = pickBestFittingTemplate(effectiveDiscipline, preferredType, day.minutes, {
      tier: effectiveTier,
      rotationKey: weekIndexInPhase,
    })
    if (!template) continue

    // A slot only earns "key" if it actually delivers the anchor stimulus.
    // When time constraints degraded it all the way to a recovery-tier
    // session, calling it "key" would contradict the explanation shown to
    // the athlete (brief §51: cohérence sportive first).
    const effectivePriority =
      priority === 'key' && template.sessionType === 'recovery' ? 'secondary' : priority

    sessions.push(
      instantiateSessionTemplate(template, { date: day.date, weekId, priority: effectivePriority }),
    )
  }

  return sessions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
