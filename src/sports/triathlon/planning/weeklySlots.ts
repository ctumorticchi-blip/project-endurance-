import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { SessionPriority } from '@/core/training/PlannedSession'
import type { Discipline } from '@/shared/types/common'
import type { SessionType } from '@/core/training/PlannedSession'
import type { SessionTier } from '@/sports/triathlon/sessions/common'
import { getLimiterAdjustedRotation } from '@/sports/triathlon/coaching/weeklyStimulusComposer'
import type { DisciplineStrengthAnalysis } from '@/sports/triathlon/coaching/limiterAnalysis'

/**
 * For a given number of available days in the week, which discipline goes
 * in each slot — ordered from the day with the *most* available minutes
 * (slot 0) down to the least. Deterministic and easy to reason about: more
 * available days progressively adds swim, a second bike/run touch, then
 * strength and mobility (brief §17: strength/mobility are compléments, not
 * a fourth core discipline, so they only appear once every other slot is
 * covered).
 */
export const WEEKLY_SLOT_DISCIPLINES: Record<number, Discipline[]> = {
  0: [],
  1: ['bike'],
  2: ['bike', 'run'],
  3: ['bike', 'run', 'swim'],
  4: ['bike', 'run', 'swim', 'run'],
  5: ['bike', 'run', 'swim', 'bike', 'run'],
  6: ['bike', 'run', 'swim', 'bike', 'run', 'strength'],
  7: ['bike', 'run', 'swim', 'bike', 'run', 'strength', 'mobility'],
}

export const WEEKLY_SLOT_PRIORITIES: SessionPriority[] = [
  'key',
  'key',
  'secondary',
  'secondary',
  'secondary',
  'optional',
  'optional',
]

type EnduranceDiscipline = 'bike' | 'run' | 'swim'

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

/**
 * The brick slot's preferred type by phase — a coaching defect found while
 * building Training Intelligence V2's Weekly Composer: this used to be the
 * literal `'brick'` sessionType always, which meant the `race-specific`
 * brick template (allures de course, distinct from the basic adaptation
 * brick) was never actually reachable by the generator despite existing in
 * the catalog since M0.3. Brick is only ever inserted in the specific
 * phase (`shouldInsertBrick` below), so only that entry matters in
 * practice; the others exist for completeness/future phases.
 */
export const PRIMARY_BRICK_TYPE_BY_PHASE: Record<TrainingPhaseName, SessionType> = {
  base: 'brick',
  build: 'brick',
  specific: 'race-specific',
  taper: 'brick',
  race: 'brick',
}

/** The session type used for any *subsequent* appearance of the same
 * discipline that week (secondary/optional touch — lighter than the anchor)
 * on a calm week: base/taper/race, or a deload/very-light week anywhere.
 * The default to fall back on once the build/specific rotation below (or
 * a manual session swap, which has no week-in-phase context) doesn't apply. */
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

/**
 * Picks the secondary-touch session type for build/specific phases. On a
 * deload/very-light week (`reduced`/`minimal` tier) the rotation is
 * skipped in favour of the calm default — a deload week should reduce
 * both volume *and* intensity broadly, not add a sharpening touch.
 * Base/taper/race never rotate: base is about steadily building volume,
 * taper/race about staying light, neither needs manufactured variety.
 *
 * The rotation itself is no longer one-size-fits-all: it comes from
 * `getLimiterAdjustedRotation` (Training Intelligence V2's Weekly Stimulus
 * Composer — `sports/triathlon/coaching/weeklyStimulusComposer.ts`), which
 * biases it toward development work for the athlete's limiter discipline
 * and toward maintenance for their strongest, instead of every athlete
 * getting the identical 4-week rotation regardless of their own
 * `disciplineLevels` (brief success criterion #1/#2). `limiterAnalysis`
 * is optional only so any caller without an `AthleteProfile` in scope
 * (none exist in the shipped app, but a defensive default matters for a
 * pure function like this one) falls back to the original generic
 * behavior rather than throwing.
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
  return rotation[weekIndexInPhase % rotation.length]!
}

/** Only used when no `limiterAnalysis` is provided — kept in sync with
 * `weeklyStimulusComposer.ts`'s own generic rotation constant so the two
 * never silently drift; see that module for the full rationale. */
const GENERIC_SECONDARY_ROTATION_FALLBACK: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'long', 'vo2max', 'endurance'],
  run: ['endurance', 'long', 'intervals', 'endurance'],
  swim: ['technique', 'endurance', 'intervals', 'endurance'],
}

/**
 * Brick placement: only in the specific phase (brief §16 "Insère les
 * bricks ... en phase spécifique et d'affûtage" — M0 keeps it to specific
 * only, since the shortest brick template is 60min and taper weeks are
 * already reduced-volume), every other week, and only when there are
 * enough days to spare one without displacing a key session.
 */
export function shouldInsertBrick(
  phase: TrainingPhaseName,
  weekIndexInPhase: number,
  numDays: number,
): boolean {
  return phase === 'specific' && weekIndexInPhase % 2 === 1 && numDays >= 4
}

/** Replaces the last non-key run/bike slot with a brick, if one exists. */
export function applyBrickInsertion(disciplines: Discipline[]): Discipline[] {
  const result = [...disciplines]
  for (let i = result.length - 1; i >= 0; i--) {
    const priority = WEEKLY_SLOT_PRIORITIES[i]
    const discipline = result[i]
    if (priority !== 'key' && (discipline === 'run' || discipline === 'bike')) {
      result[i] = 'brick'
      return result
    }
  }
  return result
}

/**
 * A second weekly swim touch for an athlete whose limiter is swim —
 * coaching defect found reviewing the Gold Standard plan (brief §34): the
 * base `WEEKLY_SLOT_DISCIPLINES` table never gives swim more than one
 * occurrence for *any* day count, so a genuinely weak swimmer with real
 * pool access twice a week still got exactly one swim session across all
 * 16 weeks — identical to an athlete for whom swim was already strong,
 * and the entire limiter-development rotation built for exactly this case
 * (`getLimiterAdjustedRotation`, `weeklyStimulusComposer.ts`) was
 * structurally unreachable for swim. Brief §19: "weak swimmers should
 * often receive proportionally more technical work rather than simply
 * more volume" — more *frequency*, not just a different session type,
 * follows the same logic. Bike/run never need this: at 4+ days they
 * already get a second occurrence from the base table.
 *
 * Skipped in taper/race (those phases deliberately reduce volume, not add
 * to it) and on a balanced athlete (nothing to bias toward). Not gated on
 * day count the way `shouldInsertBrick` is — `applyLimiterSwimTouch`
 * itself is a no-op whenever there is no spare slot to claim, which
 * naturally covers every low-day-count case without a separate check.
 * COACHING_HEURISTIC.
 */
export function shouldInsertLimiterSwimTouch(
  phase: TrainingPhaseName,
  limiterAnalysis: DisciplineStrengthAnalysis,
): boolean {
  return (
    (phase === 'base' || phase === 'build' || phase === 'specific') &&
    !limiterAnalysis.isBalanced &&
    limiterAnalysis.limiter === 'swim'
  )
}

/**
 * Replaces the last non-key occurrence of the athlete's *strongest*
 * discipline with a second swim slot — sacrificing time from wherever it
 * is least costly (brief §18/§24: maintain the strongest without
 * disproportionate time) rather than always the same fixed slot
 * regardless of who that athlete's strongest discipline actually is. A
 * no-op when that discipline has no non-key slot left to give up (e.g. a
 * brick already claimed it, or there simply aren't enough training days).
 */
export function applyLimiterSwimTouch(
  disciplines: Discipline[],
  limiterAnalysis: DisciplineStrengthAnalysis,
): Discipline[] {
  const result = [...disciplines]
  for (let i = result.length - 1; i >= 0; i--) {
    const priority = WEEKLY_SLOT_PRIORITIES[i]
    if (priority !== 'key' && result[i] === limiterAnalysis.strongest) {
      result[i] = 'swim'
      return result
    }
  }
  return result
}
