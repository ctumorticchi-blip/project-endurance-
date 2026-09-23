import type { SessionFeedback, SessionOutcome } from '@/core/history/SessionFeedback'
import type { WorkoutFamily } from '@/core/coaching/workoutFamily'
import {
  appendProgressionExposure,
  type FamilyProgressionState,
  type ProgressionResponse,
} from '@/core/coaching/progressionState'
import type { PlannedSession } from '@/core/training/PlannedSession'
import { decideProgressionResponse } from './decideProgressionResponse'
import { deriveOverallFatigueSignal } from './deriveOverallFatigueSignal'

/**
 * The session's own target RPE for progression purposes — the hardest
 * block's midpoint, since that block is what defines the session's
 * training identity (a warm-up's easy RPE shouldn't dilute a threshold
 * session's target). PRODUCT_RULE, deliberately simple.
 */
function sessionTargetRpe(session: PlannedSession): number | undefined {
  if (session.blocks.length === 0) return undefined
  return Math.max(...session.blocks.map((b) => (b.targetRpeMin + b.targetRpeMax) / 2))
}

/**
 * Pure orchestration: given a just-completed (or missed) session, its
 * family, the athlete's current progression state for that family, and
 * recent feedback history (for the overall fatigue signal), returns the
 * updated state and the decision that produced it. The caller (a feature
 * page) is responsible for loading/saving `FamilyProgressionState` via
 * `ProgressionStateRepository` — this function never touches storage
 * itself, consistent with every other engine decision function in the
 * codebase (`decideAdaptation`, `applyAdaptationToPlan`, etc.).
 */
export function processSessionFeedback(input: {
  session: PlannedSession
  outcome: SessionOutcome
  actualRpe?: number
  family: WorkoutFamily
  currentState: FamilyProgressionState
  recentFeedback: SessionFeedback[]
}): { nextState: FamilyProgressionState; response: ProgressionResponse } {
  const { session, outcome, actualRpe, family, currentState, recentFeedback } = input

  const withExposure = appendProgressionExposure(currentState, {
    date: session.date,
    level: currentState.currentLevel,
    outcome: outcome === 'missed' ? 'missed' : outcome === 'partial' ? 'partial' : 'completed',
    targetRpe: sessionTargetRpe(session),
    actualRpe,
  })

  const response = decideProgressionResponse({
    state: withExposure,
    maxLevel: family.progressionLevels,
    recentOverallFatigueElevated: deriveOverallFatigueSignal(recentFeedback),
  })

  return { nextState: { ...withExposure, currentLevel: response.nextLevel }, response }
}
