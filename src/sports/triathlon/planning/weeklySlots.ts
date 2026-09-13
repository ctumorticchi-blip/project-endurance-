import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { SessionPriority } from '@/core/training/PlannedSession'
import type { Discipline } from '@/shared/types/common'
import type { SessionType } from '@/core/training/PlannedSession'

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

/** The session type used for any *subsequent* appearance of the same
 * discipline that week (secondary/optional touch — lighter than the anchor). */
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
