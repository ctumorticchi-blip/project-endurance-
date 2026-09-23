import type { SessionType } from '@/core/training/PlannedSession'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { SessionRequirement } from '@/core/coaching/sessionRequirement'
import type { SessionTier } from '@/sports/triathlon/sessions/common'
import { getTemplatesByDiscipline } from '../sessions'
import type { DisciplineStrengthAnalysis } from './limiterAnalysis'
import { getFamilyForSession, WORKOUT_FAMILIES } from './workoutFamilies'

type EnduranceDiscipline = 'bike' | 'run' | 'swim'

/**
 * The build/specific secondary-touch rotation every athlete gets today,
 * regardless of their own strengths and weaknesses — the exact gap the
 * audit flagged: `disciplineLevels` exists on `AthleteProfile` but nothing
 * in the plan generator ever reads it. Kept here as the *generic* default
 * so the limiter-adjusted rotations below can be defined as an explicit
 * deviation from it.
 */
const GENERIC_ROTATION: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'long', 'vo2max', 'endurance'],
  run: ['endurance', 'long', 'intervals', 'endurance'],
  swim: ['technique', 'endurance', 'intervals', 'endurance'],
}

/**
 * A weak discipline benefits more from targeted technical/development work
 * than from more volume or, worse, top-end intensity it isn't ready to
 * absorb specifically (brief §19: "weak swimmers should often receive
 * proportionally more technical work rather than simply more volume" —
 * generalized here to bike/run too). Replaces the generic rotation's
 * top-end entry (vo2max/intervals) with a second technique/development
 * touch instead. COACHING_HEURISTIC.
 */
const LIMITER_DEVELOPMENT_ROTATION: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'technique', 'endurance', 'tempo'],
  run: ['endurance', 'technique', 'endurance', 'tempo'],
  swim: ['technique', 'endurance', 'technique', 'css'],
}

/**
 * The athlete's strongest discipline is maintained, not developed further
 * at disproportionate time cost (brief §18's "produce the appropriate bike
 * performance without destroying the run", generalized to every
 * discipline, and success criterion #2). Its secondary touches drop the
 * rotation's long/top-end entries entirely and stay at an easy/maintenance
 * default. COACHING_HEURISTIC.
 */
const STRENGTH_MAINTENANCE_ROTATION: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'endurance', 'recovery', 'endurance'],
  run: ['endurance', 'endurance', 'recovery', 'endurance'],
  swim: ['endurance', 'endurance', 'recovery', 'endurance'],
}

/**
 * Resolves the build/specific secondary-touch rotation for one discipline,
 * biased by the athlete's own limiter analysis — the mechanism that makes
 * two athletes preparing the same race receive meaningfully different
 * programs (brief success criterion #1) instead of the same generic
 * rotation regardless of who is actually weak where.
 *
 * A *balanced* athlete (no limiter/strongest distinction — see
 * `limiterAnalysis.isBalanced`) gets the generic rotation for every
 * discipline, same as today — there is nothing to bias toward without a
 * real gap between disciplines.
 */
export function getLimiterAdjustedRotation(
  discipline: EnduranceDiscipline,
  limiterAnalysis: DisciplineStrengthAnalysis,
): SessionType[] {
  if (limiterAnalysis.isBalanced) return GENERIC_ROTATION[discipline]
  if (discipline === limiterAnalysis.limiter) return LIMITER_DEVELOPMENT_ROTATION[discipline]
  if (discipline === limiterAnalysis.strongest) return STRENGTH_MAINTENANCE_ROTATION[discipline]
  return GENERIC_ROTATION[discipline]
}

/** The session type used the *first* time a discipline appears in the
 * week (its anchor session for that phase). */
export const PRIMARY_SESSION_TYPE_BY_PHASE: Record<
  TrainingPhaseName,
  Record<EnduranceDiscipline, SessionType>
> = {
  base: { bike: 'long', run: 'long', swim: 'technique' },
  build: { bike: 'sweet-spot', run: 'tempo', swim: 'css' },
  specific: { bike: 'threshold', run: 'threshold', swim: 'threshold' },
  taper: { bike: 'tempo', run: 'tempo', swim: 'endurance' },
  race: { bike: 'recovery', run: 'recovery', swim: 'recovery' },
}

/** The session type used for any *subsequent* appearance of the same
 * discipline that week (secondary/optional touch — lighter than the anchor)
 * on a calm week: base/taper/race, or a deload/very-light week anywhere.
 * The default to fall back on once the build/specific rotation below
 * doesn't apply. */
export const SECONDARY_SESSION_TYPE_BY_PHASE: Record<
  TrainingPhaseName,
  Record<EnduranceDiscipline, SessionType>
> = {
  base: { bike: 'endurance', run: 'endurance', swim: 'endurance' },
  build: { bike: 'endurance', run: 'endurance', swim: 'technique' },
  specific: { bike: 'sweet-spot', run: 'tempo', swim: 'endurance' },
  taper: { bike: 'recovery', run: 'recovery', swim: 'recovery' },
  race: { bike: 'recovery', run: 'recovery', swim: 'recovery' },
}

/** Only used when no `limiterAnalysis` is provided — kept in sync with
 * `getLimiterAdjustedRotation`'s own generic rotation constant so the two
 * never silently drift. */
const GENERIC_SECONDARY_ROTATION_FALLBACK: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'long', 'vo2max', 'endurance'],
  run: ['endurance', 'long', 'intervals', 'endurance'],
  swim: ['technique', 'endurance', 'intervals', 'endurance'],
}

/**
 * Picks the secondary-touch session type for build/specific phases. On a
 * deload/very-light week (`reduced`/`minimal` tier) the rotation is
 * skipped in favour of the calm default — a deload week should reduce
 * both volume *and* intensity broadly, not add a sharpening touch.
 * Base/taper/race never rotate: base is about steadily building volume,
 * taper/race about staying light, neither needs manufactured variety.
 *
 * `limiterAnalysis` is optional only so any caller without an
 * `AthleteProfile` in scope falls back to the original generic behavior
 * rather than throwing.
 */
export function getSecondaryType(
  phase: TrainingPhaseName,
  discipline: EnduranceDiscipline,
  weekIndexInPhase: number,
  tier: SessionTier,
  limiterAnalysis?: DisciplineStrengthAnalysis,
): SessionType {
  const calmDefault = SECONDARY_SESSION_TYPE_BY_PHASE[phase][discipline]
  const isRotationEligible = (phase === 'build' || phase === 'specific') && tier !== 'reduced' && tier !== 'minimal'
  if (!isRotationEligible) return calmDefault

  const rotation = limiterAnalysis
    ? getLimiterAdjustedRotation(discipline, limiterAnalysis)
    : GENERIC_SECONDARY_ROTATION_FALLBACK[discipline]
  const picked = rotation[weekIndexInPhase % rotation.length]!
  const anchorType = PRIMARY_SESSION_TYPE_BY_PHASE[phase][discipline]

  // A secondary/support touch must be a genuinely different, lighter
  // stimulus than the week's own anchor — never an exact repeat of it.
  // Coaching defect found during the Training Intelligence V2.1 audit
  // (brief §20, swim quality/content): a hand-authored rotation entry
  // that happens to equal the phase's own anchor type isn't "a second
  // touch", it silently schedules the anchor stimulus twice in the same
  // week (this can occur for a limiter athlete once the deload-week
  // exclusion above doesn't happen to line up with it). Checked
  // generically against `PRIMARY_SESSION_TYPE_BY_PHASE` rather than
  // hand-fixing the one rotation table entry that currently triggers it.
  if (picked === anchorType) return calmDefault

  // On the phase's hardest (`peak`) week, the anchor session is already at
  // its toughest version of its own stimulus — stacking a second,
  // independently high-cost stimulus of the SAME discipline on top of it
  // compounds fatigue exactly when the week is already carrying the most.
  // Coaching defect found during the Training Intelligence V2.1 audit
  // (brief §16, Week 8): a bike-neutral athlete's build-phase peak week
  // combined a tier-bumped Sweet Spot anchor with a rotation-driven VO2max
  // secondary touch — two independently demanding bike sessions in one
  // week, on top of that week's already-hard swim CSS and run tempo
  // anchors. Detected generically via the family registry's own
  // `incompatibleNeighbors` (already authored to flag exactly this pair,
  // `BIKE_SWEET_SPOT` ↔ `BIKE_VO2`, for adjacent-day placement) rather
  // than a new hardcoded "top-end session type" table — so it generalizes
  // to any future family pair the registry marks incompatible, and to any
  // discipline, not just bike, without special-casing this one week.
  if (tier === 'peak') {
    const anchorFamily = getFamilyForSession(discipline, anchorType)
    const pickedFamily = getFamilyForSession(discipline, picked)
    if (anchorFamily && pickedFamily && anchorFamily.incompatibleNeighbors?.includes(pickedFamily.id)) {
      return calmDefault
    }
  }

  return picked
}

/**
 * The brick slot's preferred type by phase. Brick is only ever requested
 * in the specific phase (see `brickRequirementForWeek` below), so only
 * that entry matters in practice; the others exist for completeness.
 */
export const PRIMARY_BRICK_TYPE_BY_PHASE: Record<TrainingPhaseName, SessionType> = {
  base: 'brick',
  build: 'brick',
  specific: 'race-specific',
  taper: 'brick',
  race: 'brick',
}

// ============================================================================
// Training Intelligence V2.1 — dynamic weekly composition.
//
// V2 still depended on `WEEKLY_SLOT_DISCIPLINES`, a fixed table keyed only
// by day *count*, to decide how many times each discipline trains this
// week. Two documented workarounds (`applyLimiterSwimTouch`,
// `applyBrickInsertion`) then mutated that fixed allocation after the
// fact — a limiter-swim athlete's second swim touch existed only by
// *replacing* a slot the table had already given to another discipline,
// and it silently disappeared whenever no such slot was available (brick
// weeks, low day counts). The composer was deciding *some* of what the
// athlete needed, but the table was still deciding the rest, and the two
// could conflict.
//
// V2.1 removes the fixed table entirely (see `docs/dynamic-composition.md`).
// `generateWeeklySessionRequirements` is now the *only* source of "what
// disciplines train how often this week, and why" — it consumes a
// `WeeklyTrainingBudget` (day count *and* minute count, brief §6) and the
// athlete's limiter analysis, and produces a flat list of
// `SessionRequirement`s with no day attached yet. `buildWeekSessions.ts`
// then *places* that list on real calendar days; it no longer decides
// frequency at all.
// ============================================================================

export interface WeeklyTrainingBudget {
  /** Days with enough declared time to be worth a session at all (after
   * rest days are already excluded) — a ceiling, never a target (brief §26). */
  availableDays: number
  /** Of those, how many also have pool access — swim can never be
   * requested more often than this (brief §8: pool access is a
   * constraint, not a priority hack, so it is enforced here, during
   * composition, rather than patched during placement). */
  poolAccessibleDays: number
  /** Total declared minutes across `availableDays` — a ceiling, never a
   * target (brief §25): the composer is not entitled to spend all of it. */
  availableMinutes: number
  phase: TrainingPhaseName
  tier: SessionTier
}

export function computeWeeklyTrainingBudget(
  days: { minutes: number; pool: boolean }[],
  phase: TrainingPhaseName,
  tier: SessionTier,
): WeeklyTrainingBudget {
  return {
    availableDays: days.length,
    poolAccessibleDays: days.filter((d) => d.pool).length,
    availableMinutes: days.reduce((sum, d) => sum + d.minutes, 0),
    phase,
    tier,
  }
}

/**
 * A coarse, deliberately conservative average session length per phase,
 * used only to derive a *minutes-based* ceiling on how many sessions the
 * week can support — distinct from (and usually stricter than) the
 * day-count ceiling. PRODUCT_RULE: without this, an athlete with 6
 * training days but only 3 real hours would still be composed a 6-session
 * week, each shrunk to near-uselessness at placement time (exactly the
 * "six meaningless short sessions" brief §6 warns against).
 */
const AVG_SESSION_MINUTES_BY_PHASE: Record<TrainingPhaseName, number> = {
  base: 45,
  build: 50,
  specific: 55,
  taper: 35,
  race: 25,
}

function estimateMaxSessionCount(budget: WeeklyTrainingBudget): number {
  const minutesCeiling = Math.floor(budget.availableMinutes / AVG_SESSION_MINUTES_BY_PHASE[budget.phase])
  return Math.max(0, Math.min(budget.availableDays, minutesCeiling))
}

/** The median duration of the `tier`'s authored templates for this
 * (discipline, sessionType), falling back to 'standard' if this tier has
 * no template of that type — a real, catalog-grounded number rather than
 * a duplicated magic-number table, used only to reason about the week's
 * time budget before any specific day is chosen. */
function representativeDurationMin(
  discipline: SessionRequirement['discipline'],
  sessionType: SessionType,
  tier: SessionTier,
): number {
  const candidates = getTemplatesByDiscipline(discipline).filter((t) => t.sessionType === sessionType)
  const tierMatches = candidates.filter((t) => t.tier === tier)
  const pool = tierMatches.length > 0 ? tierMatches : candidates.filter((t) => t.tier === 'standard')
  if (pool.length === 0) return 30
  const sorted = [...pool].sort((a, b) => a.estimatedDurationMin - b.estimatedDurationMin)
  return sorted[Math.floor(sorted.length / 2)]!.estimatedDurationMin
}

/**
 * Brick progression across the specific phase (brief V2.1 §21: is one
 * random brick across 16 weeks really sufficient?) — a genuine three-stage
 * exposure keyed only on phase/week-position, applicable to any athlete
 * with enough budget, never hand-inserted into a specific plan's weeks:
 *  - the specific phase's *first* week introduces the cheaper
 *    `BRICK_ADAPTATION` family (basic transition exposure);
 *  - every other week after that uses `BRICK_SPECIFIC` (race-pace
 *    transition under controlled fatigue), same cadence V2 already had;
 *  - the specific phase's *last* week, if the athlete's budget can
 *    plausibly support it (≥5 training days that week), escalates once to
 *    `BRICK_RACE_REHEARSAL` — a limited full-race simulation right before
 *    taper begins. COACHING_HEURISTIC.
 * Brick still requires ≥4 training days full stop (a composite session
 * needs a real day to sit on, brief §9), and only ever fires in the
 * specific phase — the phase whose entire purpose is race specificity.
 */
function brickRequirementForWeek(
  budget: WeeklyTrainingBudget,
  weekIndexInPhase: number,
  weeksInPhase: number,
): string | undefined {
  if (budget.phase !== 'specific' || budget.availableDays < 4) return undefined
  const isLastSpecificWeek = weekIndexInPhase === weeksInPhase - 1
  if (isLastSpecificWeek && weeksInPhase >= 3 && budget.availableDays >= 5) return 'BRICK_RACE_REHEARSAL'
  if (weekIndexInPhase === 0) return 'BRICK_ADAPTATION'
  if (weekIndexInPhase % 2 === 1) return 'BRICK_SPECIFIC'
  return undefined
}

/**
 * A family's `defaultPriority` describes how important that *type* of
 * stimulus generally is — but the same family can be used both as a
 * discipline's anchor session and as a secondary-rotation entry (e.g.
 * `BIKE_LONG` is the base-phase anchor *and* one of the build/specific
 * rotation's entries), so it cannot alone tell "was this the week's only/
 * primary touch on this discipline" from "was this a supplementary one".
 * That is a positional fact, not a family fact — `priorityOverride` lets
 * the caller supply it for swim/bike/run (anchor = KEY_A, secondary
 * touch = SUPPORT, matching the proven V2 behavior this exact ambiguity
 * broke on the first attempt at deriving priority purely from family
 * metadata). Composite/complement disciplines (brick, strength) have no
 * such positional ambiguity — each is at most one occurrence per week —
 * so they always use the family's own `defaultPriority` unmodified,
 * which is itself a genuine improvement over V2 (a specific-phase brick
 * or a full base-phase strength session is now labeled by what it
 * actually is, not a fixed slot position).
 */
function requirementFromFamily(
  familyId: string,
  discipline: SessionRequirement['discipline'],
  sessionType: SessionType,
  occurrenceIndex: number,
  preferredDurationMin: number,
  reasonCodes: string[],
  priorityOverride?: SessionRequirement['priority'],
): SessionRequirement {
  const family = WORKOUT_FAMILIES[familyId]!
  return {
    discipline,
    familyId,
    sessionType,
    priority: priorityOverride ?? family.defaultPriority,
    preferredDurationMin,
    minimumEffectiveDurationMin: family.minimumEffectiveDurationMin,
    requiresPoolAccess: discipline === 'swim',
    fatigueCost: family.fatigueCost,
    recoveryRequirement: family.recoveryRequirement,
    compatibleFamilies: family.compatibleNeighbors ?? [],
    incompatibleFamilies: family.incompatibleNeighbors ?? [],
    occurrenceIndex,
    reasonCodes,
    evidenceClassification: family.evidenceClassification,
  }
}

export interface GenerateWeeklySessionRequirementsInput {
  weekIndexInPhase: number
  weeksInPhase: number
  tier: SessionTier
  budget: WeeklyTrainingBudget
  limiterAnalysis: DisciplineStrengthAnalysis
}

/**
 * The Weekly Composer's complete output: every session the athlete needs
 * this week, decided from coaching state alone — no calendar day is
 * involved yet. See the module-level comment above for what this
 * replaces and why.
 */
export function generateWeeklySessionRequirements(
  input: GenerateWeeklySessionRequirementsInput,
): SessionRequirement[] {
  const { weekIndexInPhase, weeksInPhase, tier, budget, limiterAnalysis } = input
  const { phase } = budget

  const totalSlots = estimateMaxSessionCount(budget)
  if (totalSlots === 0) return []

  const frequency: Record<EnduranceDiscipline, number> = { swim: 0, bike: 0, run: 0 }
  const reasonsByDiscipline: Record<EnduranceDiscipline, string[][]> = { swim: [], bike: [], run: [] }

  if (totalSlots >= 3) {
    const swimHasPool = budget.poolAccessibleDays > 0
    frequency.swim = swimHasPool ? 1 : 0
    frequency.bike = 1
    frequency.run = 1
    reasonsByDiscipline.bike.push(['ANCHOR_SESSION'])
    reasonsByDiscipline.run.push(['ANCHOR_SESSION'])
    if (swimHasPool) {
      reasonsByDiscipline.swim.push(['ANCHOR_SESSION'])
    } else {
      // No pool access anywhere this week: don't invent a poolless swim
      // session — the freed slot becomes a second bike touch instead, so
      // total session count isn't silently reduced (brief §17: no training
      // debt — the same principle applies to composition losing a
      // discipline to a resource constraint, not only to adaptation).
      frequency.bike += 1
      reasonsByDiscipline.bike.push(['POOL_UNAVAILABLE_REALLOCATED'])
    }
  } else {
    // Very constrained week: minimal coverage only, bike first (needs no
    // specific resource, always placeable), then run, then swim if pool
    // access exists — a deterministic PRODUCT_RULE, not a claim that bike
    // matters more than swim/run in general.
    const order: EnduranceDiscipline[] = ['bike', 'run', 'swim']
    let used = 0
    for (const d of order) {
      if (used >= totalSlots) break
      if (d === 'swim' && budget.poolAccessibleDays === 0) continue
      frequency[d] = 1
      reasonsByDiscipline[d].push(['MINIMAL_COVERAGE'])
      used++
    }
  }

  const usedSlots = frequency.swim + frequency.bike + frequency.run
  let remainingSlots = totalSlots - usedSlots

  const brickFamilyId = brickRequirementForWeek(budget, weekIndexInPhase, weeksInPhase)
  const brickRequired = brickFamilyId !== undefined && remainingSlots >= 1
  if (brickRequired) remainingSlots -= 1

  // Tentatively reserve one day-slot for strength *before* the touch-
  // allocation loop below can spend every remaining slot on more
  // swim/bike/run — without this, a generous budget (e.g. 6 days) let the
  // loop push every endurance discipline to 2 occurrences, leaving zero
  // days for strength regardless of how much spare time existed (a real
  // defect: strength silently disappeared entirely at exactly the day
  // counts where V2 always gave it a slot). The reservation is undone
  // below if there genuinely isn't enough *time* left once real durations
  // are known — a reserved day that ends up unused is a legitimate
  // outcome (brief §26: no filler), not a bug.
  const strengthSlotReserved = phase !== 'race' && remainingSlots >= 1
  if (strengthSlotReserved) remainingSlots -= 1

  // Second (and further) touches: biased toward the athlete's own limiter
  // in phases whose job is development (base/build/specific — brief
  // success criterion #1); a *neutral*, unbiased order in taper, whose job
  // is to preserve balance rather than develop anything further; skipped
  // entirely in race week (brief §26: no filler, ever, this close to the
  // start line).
  if (phase !== 'race' && remainingSlots > 0) {
    const touchOrder: EnduranceDiscipline[] =
      phase === 'taper' || limiterAnalysis.isBalanced
        ? ['bike', 'run', 'swim']
        : [
            limiterAnalysis.limiter,
            ...(['bike', 'run', 'swim'] as EnduranceDiscipline[]).filter(
              (d) => d !== limiterAnalysis.limiter && d !== limiterAnalysis.strongest,
            ),
            limiterAnalysis.strongest,
          ]
    const reasonForTouch = (d: EnduranceDiscipline): string =>
      phase === 'taper' || limiterAnalysis.isBalanced
        ? 'NEUTRAL_TOUCH'
        : d === limiterAnalysis.limiter
          ? 'LIMITER_DEVELOPMENT_TOUCH'
          : d === limiterAnalysis.strongest
            ? 'STRONGEST_MAINTENANCE_TOUCH'
            : 'NEUTRAL_TOUCH'

    for (const d of touchOrder) {
      if (remainingSlots <= 0) break
      if (frequency[d] >= 2) continue
      if (d === 'swim' && frequency.swim >= budget.poolAccessibleDays) continue
      frequency[d] += 1
      reasonsByDiscipline[d].push([reasonForTouch(d)])
      remainingSlots -= 1
    }
  }

  const requirements: SessionRequirement[] = []

  for (const discipline of ['swim', 'bike', 'run'] as EnduranceDiscipline[]) {
    for (let occurrence = 0; occurrence < frequency[discipline]; occurrence++) {
      const sessionType =
        occurrence === 0
          ? PRIMARY_SESSION_TYPE_BY_PHASE[phase][discipline]
          : getSecondaryType(phase, discipline, weekIndexInPhase, tier, limiterAnalysis)
      const family = getFamilyForSession(discipline, sessionType)
      if (!family) continue
      const preferredDuration = representativeDurationMin(discipline, sessionType, tier)
      const reasons = reasonsByDiscipline[discipline][occurrence] ?? ['NEUTRAL_TOUCH']
      // Positional, not family-derived — see `requirementFromFamily`'s
      // docstring for why (a family like BIKE_LONG is both an anchor type
      // and a rotation entry, so its own defaultPriority can't tell which
      // role this particular occurrence is playing this week).
      const priorityOverride = occurrence === 0 ? 'KEY_A' : 'SUPPORT'
      requirements.push(
        requirementFromFamily(family.id, discipline, sessionType, occurrence, preferredDuration, reasons, priorityOverride),
      )
    }
  }

  if (brickRequired && brickFamilyId) {
    const brickFamily = WORKOUT_FAMILIES[brickFamilyId]!
    const preferredDuration = representativeDurationMin('brick', brickFamily.sessionType, tier)
    requirements.push(
      requirementFromFamily(brickFamilyId, 'brick', brickFamily.sessionType, 0, preferredDuration, [
        'BRICK_PROGRESSION',
      ]),
    )
  }

  // Strength: a real day slot (`daysStillFree`), not the more conservative
  // minutes-derived `totalSlots` — strength is low-intensity enough to use
  // a day the coarse per-session-minutes heuristic excluded — but still
  // gated on genuinely having *time* left after every core session's
  // preferred duration is accounted for (brief §10/§26: never merely
  // because a slot exists; strength consumes recovery budget and must earn
  // its place like everything else). Never requested in race week.
  if (phase !== 'race') {
    const coreSessionsCount = frequency.swim + frequency.bike + frequency.run + (brickRequired ? 1 : 0)
    const daysStillFree = budget.availableDays - coreSessionsCount
    // Capped at the week's average minutes/day, not each requirement's raw
    // `preferredDurationMin` — a real coaching defect found reviewing the
    // Gold Standard plan: a base-phase "long" anchor's preferred duration
    // (representative of the *ideal* template, ~150min for bike) is almost
    // always far more than any single day in a 6-7 day week actually has,
    // so it will degrade heavily once placed (brief §7's own fallback
    // chain). Summing the *ideal* durations to decide whether strength has
    // room left systematically overestimates how much time the week's core
    // sessions will really consume, which silently excluded strength from
    // 4 of 5 base-phase weeks in a row — coherent only by accident (the one
    // week it appeared in happened to have smaller ideal durations, not
    // more real leftover time). Capping each estimate at a realistic
    // per-day share fixes the estimate without needing to know actual day
    // assignments yet (composition still happens before placement).
    const averageMinutesPerDay = budget.availableDays > 0 ? budget.availableMinutes / budget.availableDays : 0
    const estimatedCoreMinutes = requirements.reduce(
      (sum, r) => sum + Math.min(r.preferredDurationMin, averageMinutesPerDay),
      0,
    )
    const minutesLeftover = budget.availableMinutes - estimatedCoreMinutes
    const strengthFamilyId = phase === 'base' || phase === 'build' ? 'STRENGTH_FOUNDATION' : 'STRENGTH_MAINTENANCE'
    const strengthFamily = WORKOUT_FAMILIES[strengthFamilyId]!

    if (daysStillFree >= 1 && minutesLeftover >= strengthFamily.minimumEffectiveDurationMin) {
      const preferredDuration = Math.min(
        representativeDurationMin('strength', 'strength', phase === 'base' || phase === 'build' ? tier : 'reduced'),
        minutesLeftover,
      )
      requirements.push(
        requirementFromFamily(strengthFamilyId, 'strength', 'strength', 0, preferredDuration, [
          'RECOVERY_BUDGET_AVAILABLE',
        ]),
      )
    }
  }

  return requirements
}
