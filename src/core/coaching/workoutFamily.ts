import type { EvidenceClassification } from './evidenceClassification'
import type { StimulusPriority } from './stimulusPriority'
import type { SessionType } from '@/core/training/PlannedSession'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { Discipline, Level } from '@/shared/types/common'

export type FatigueCost = 'low' | 'moderate' | 'high'

/**
 * How much recovery this family's exposures typically need before another
 * high-cost session (of any discipline — a hard bike costs the legs a hard
 * run needs too), expressed in whole training days rather than hours: a
 * coarse, deliberately simple heuristic (COACHING_HEURISTIC — see
 * `docs/coaching-methodology.md`), not a physiological model.
 */
export type RecoveryRequirement = 0 | 1 | 2

/**
 * A Workout Family is a *named training stimulus with a progression*, not
 * a single fixed workout (brief §9–§11). It groups every existing
 * `SessionTemplate` of a given (discipline, `SessionType`) pair — see
 * `sports/triathlon/coaching/workoutFamilies.ts` for the concrete
 * triathlon families and how they map onto the existing session catalog
 * (`sports/triathlon/sessions/`) — this type is deliberately sport-agnostic
 * so a future running/cycling/swimming module can define its own family
 * instances without changing this shape.
 *
 * This is an *annotation layer* over the existing catalog, not a
 * replacement for it: `SessionTemplate`/`SessionTier` still hold the
 * actual authored blocks; a `WorkoutFamily` explains *why* a given
 * (discipline, sessionType) exists, when it belongs, and how a coach
 * should reason about substituting or sequencing it.
 */
export interface WorkoutFamily {
  /** Stable id, e.g. `'RUN_THRESHOLD'` — matches the concrete catalog's `SessionType`+discipline pairing. */
  id: string
  discipline: Discipline
  /** The existing `SessionType` this family corresponds to in the session catalog. */
  sessionType: SessionType
  /** One-sentence coaching purpose, e.g. "Develop sustainable threshold power." */
  trainingPurpose: string
  /** The underlying physiological system this stimulus targets. */
  physiologicalIntent: string
  appropriatePhases: TrainingPhaseName[]
  /** How relevant this family is to a Sprint vs. Olympic/M build — informs the
   * Weekly Composer's discipline/family allocation, not just a flavor note. */
  raceFormatRelevance: Partial<Record<'sprint' | 'olympic', 'primary' | 'secondary' | 'minor'>>
  minimumAthleteLevel?: Level
  /** How many distinct progression levels this family's ladder has — see
   * `core/coaching/progressionState.ts` and `engine/progression/`. */
  progressionLevels: number
  defaultPriority: StimulusPriority
  fatigueCost: FatigueCost
  recoveryRequirement: RecoveryRequirement
  /**
   * Below this duration, the family's stimulus is no longer meaningfully
   * delivered — a "long ride" at 20min isn't a shorter long ride, it's a
   * different (easier) session (brief V2.1 §7). Distinct from
   * `preferredDurationMin` on a `SessionRequirement`: this is a fixed
   * property of the *family*, used both to decide which day a requirement
   * needs (`weeklyStimulusComposer.ts`) and to know when a requirement
   * should be dropped/replaced rather than scheduled at a token duration
   * (`buildWeekSessions.ts`). COACHING_HEURISTIC — a deliberately coarse
   * threshold, not derived from athlete-specific physiology.
   */
  minimumEffectiveDurationMin: number
  /** Family ids this one sequences well with in the same week (e.g. an easy
   * swim the day after a hard bike). Advisory, used by the recovery
   * compatibility pass in `buildWeekSessions.ts`'s `resolveRecoveryConflicts`. */
  compatibleNeighbors?: string[]
  /** Family ids that should not be scheduled on the same or adjacent day
   * without an explicit reason (e.g. two high-cost bike sessions back to
   * back) — enforced by `resolveRecoveryConflicts` (`buildWeekSessions.ts`). */
  incompatibleNeighbors?: string[]
  requiredEquipment?: string[]
  /** `KnownMetrics` field name(s) that unlock a precise (not RPE-fallback)
   * prescription for this family, e.g. `['ftpWatts']`. */
  requiredMetric?: string[]
  /** What to prescribe when `requiredMetric` isn't known — always RPE, but
   * spelled out so the explanation layer can say so plainly. */
  fallbackPrescription: string
  /** Athlete-facing one-liner used by the "why this session" explanation. */
  explanation: string
  evidenceClassification: EvidenceClassification
}
