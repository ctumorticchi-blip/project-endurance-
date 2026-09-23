import type { DateISO, Discipline } from '@/shared/types/common'
import type { WorkoutBlock } from './WorkoutBlock'

export type SessionType =
  | 'technique'
  | 'endurance'
  | 'tempo'
  | 'sweet-spot'
  | 'threshold'
  | 'vo2max'
  | 'css'
  | 'intervals'
  | 'long'
  | 'recovery'
  | 'strength'
  | 'mobility'
  | 'brick'
  | 'transition'
  | 'race-specific'

/**
 * `key` sessions anchor the week (the long ride, the quality run) and are
 * the last thing the adaptation engine reduces or removes. `optional`
 * sessions (mobility, easy technique work) are the first to go when time
 * is short (brief §29: a missed easy session ≠ a missed key session).
 */
export type SessionPriority = 'key' | 'secondary' | 'optional'

export interface PlannedSession {
  id: string
  discipline: Discipline
  sessionType: SessionType
  title: string
  /** The "why" narrative shown on the Today screen. */
  objective: string
  blocks: WorkoutBlock[]
  estimatedDurationMin: number
  /**
   * The Workout Family this session was generated from (see
   * `core/coaching/workoutFamily.ts`), when the sport module populates one.
   * Optional and additive (Coaching Experience V1): lets the presentation
   * layer resolve `WorkoutFamily.trainingPurpose`/`physiologicalIntent`/
   * `explanation`/`evidenceClassification` without re-deriving them from
   * `discipline`+`sessionType` alone, and without risk to older persisted
   * plans that predate this field (simply absent, never wrong).
   */
  familyId?: string
  /**
   * Why the Weekly Composer requested this specific occurrence this week
   * (e.g. `'ANCHOR_SESSION'`, `'LIMITER_DEVELOPMENT_TOUCH'` — see
   * `weeklyStimulusComposer.ts`), copied from the `SessionRequirement` that
   * produced it. Composition-time-only reasoning that has no other way to
   * reach the UI once a real day is chosen (brief Coaching Experience V1
   * §1: expose the engine's real reason, never a UI guess). Optional: only
   * triathlon sessions populate it today.
   */
  reasonCodes?: string[]
  /**
   * Duration and blocks exactly as generated, before any same-day
   * adaptation (readiness check-in, "less time today"). Every such
   * decision is computed relative to this baseline rather than the
   * current `estimatedDurationMin`/`blocks` — otherwise a sequence of
   * check-ins (tired → normal → tired) would compound instead of each
   * being an independent, fresh decision from the actual plan.
   */
  plannedDurationMin: number
  plannedBlocks: WorkoutBlock[]
  priority: SessionPriority
  date: DateISO
  weekId: string
}

export function createPlannedSession(
  input: Omit<PlannedSession, 'id' | 'plannedDurationMin' | 'plannedBlocks'>,
): PlannedSession {
  return {
    ...input,
    id: crypto.randomUUID(),
    plannedDurationMin: input.estimatedDurationMin,
    plannedBlocks: input.blocks,
  }
}
