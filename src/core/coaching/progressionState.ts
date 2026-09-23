import type { DateISO } from '@/shared/types/common'

/**
 * The five coaching decisions Training Intelligence V2 can reach about an
 * athlete's progression within one workout family (brief §14):
 *
 * - `PROGRESS` — the stimulus was absorbed; move to the next ladder level.
 * - `MAINTAIN` — appropriate stimulus, not enough evidence yet to move.
 * - `REGRESS` — the current level looks too demanding; step back one.
 * - `RECOVER` — accumulated fatigue means progression should pause (the
 *   ladder level itself isn't the problem).
 * - `RECALIBRATE` — repeated evidence (not one session) suggests the
 *   *intensity target* (zone/pace/power), not just the ladder level, is
 *   stale — see `engine/progression/decideProgressionResponse.ts`.
 *
 * Distinct from `AdaptationDecision` (`KEEP/REDUCE/INCREASE/MOVE/REPLACE/
 * REMOVE`, `engine/adaptation/`): that engine reacts to *today's* real-life
 * disruption for *one session*. This one reasons about the athlete's
 * multi-exposure trend within a *workout family* and decides what the
 * *next* prescription of that family should look like. Both can fire for
 * the same session on the same day without contradiction — real life can
 * shrink a session down to today's available time while the progression
 * engine still separately concludes it's time to move to the next level
 * for that family's *next* exposure.
 */
export type ProgressionDecision = 'PROGRESS' | 'MAINTAIN' | 'REGRESS' | 'RECOVER' | 'RECALIBRATE'

/** One recorded exposure to a workout family, the minimum evidence needed
 * to reason about progression (brief §13: "what was prescribed, how did
 * the athlete respond, what should happen next"). */
export interface ProgressionExposure {
  date: DateISO
  level: number
  outcome: 'completed' | 'partial' | 'missed'
  targetRpe?: number
  actualRpe?: number
}

/** How many recent exposures the state keeps — enough for the
 * recalibration check's repeated-evidence requirement, not an unbounded
 * log (that belongs to `CompletedSessionRepository`/`SessionFeedbackRepository`). */
export const PROGRESSION_HISTORY_LENGTH = 6

export interface FamilyProgressionState {
  familyId: string
  currentLevel: number
  /** Most-recent-last, capped at `PROGRESSION_HISTORY_LENGTH`. */
  history: ProgressionExposure[]
}

export function createInitialProgressionState(familyId: string, startingLevel = 1): FamilyProgressionState {
  return { familyId, currentLevel: startingLevel, history: [] }
}

/** Appends an exposure, trimming the history to `PROGRESSION_HISTORY_LENGTH`
 * — never mutates the input state (every progression function in this
 * codebase is pure, consistent with `applyAdaptationToPlan.ts`'s convention). */
export function appendProgressionExposure(
  state: FamilyProgressionState,
  exposure: ProgressionExposure,
): FamilyProgressionState {
  const history = [...state.history, exposure].slice(-PROGRESSION_HISTORY_LENGTH)
  return { ...state, history }
}

export interface ProgressionResponse {
  decision: ProgressionDecision
  reasonCodes: ProgressionReasonCode[]
  explanation: string
  /** The level the family's *next* exposure should target. */
  nextLevel: number
}

export type ProgressionReasonCode =
  | 'ATHLETE_READY_TO_PROGRESS'
  | 'TARGET_RPE_MATCHED'
  | 'RPE_HIGHER_THAN_EXPECTED'
  | 'RPE_LOWER_THAN_EXPECTED'
  | 'PERSISTENT_FATIGUE'
  | 'MISSED_LAST_EXPOSURE'
  | 'INSUFFICIENT_HISTORY'
  | 'ZONE_RECALIBRATION_REQUIRED'
  | 'MAX_LEVEL_REACHED'
