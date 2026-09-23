import type { PlannedSession } from '@/core/training/PlannedSession'
import { explainReasonCode } from '@/sports/triathlon/coaching/reasonCodeLabels'
import { WORKOUT_FAMILIES } from '@/sports/triathlon/coaching/workoutFamilies'

/**
 * "Why this session?" (Coaching Experience V1 brief §9), built entirely
 * from real engine data attached to the session — never a generic
 * template. `undefined` when the session carries no `familyId` (older
 * persisted plans from before this field existed, or a sport module, e.g.
 * running, that doesn't populate a Workout Family yet): the caller falls
 * back to `session.objective`, the pre-existing generic text, rather than
 * showing a broken or fabricated explanation.
 */
export interface SessionExplanation {
  /** The family's own athlete-facing "why", already written for this exact purpose. */
  headline: string
  /** Why the composer placed THIS occurrence this week, when recorded. */
  placementNote?: string
  trainingPurpose: string
  physiologicalIntent: string
}

export function explainSession(session: PlannedSession): SessionExplanation | undefined {
  const family = session.familyId ? WORKOUT_FAMILIES[session.familyId] : undefined
  if (!family) return undefined

  return {
    headline: family.explanation,
    placementNote: explainReasonCode(session.reasonCodes),
    trainingPurpose: family.trainingPurpose,
    physiologicalIntent: family.physiologicalIntent,
  }
}
