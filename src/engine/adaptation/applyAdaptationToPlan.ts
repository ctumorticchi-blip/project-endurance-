import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPlan } from '@/core/training/TrainingPlan'
import { estimateWeekLoad } from '@/engine/metrics/load'
import type { AdaptationDecision } from './AdaptationDecision'

/** Never let a scaled block collapse to nothing. */
const MIN_BLOCK_SECONDS = 5

/**
 * Turns a REDUCE/INCREASE/REPLACE decision into an updated `PlannedSession`:
 * every block's duration is scaled by the same before/after ratio so the
 * session's structure stays internally consistent, rather than only the
 * headline duration changing while the block list still adds up to the
 * old total.
 */
export function applyDurationAdaptation(
  session: PlannedSession,
  decision: AdaptationDecision,
): PlannedSession {
  const before = decision.before.estimatedDurationMin
  const after = decision.after.estimatedDurationMin
  const newDate = decision.after.date

  if (before === after && !newDate) return session

  const ratio = before > 0 ? after / before : 1

  return {
    ...session,
    estimatedDurationMin: after,
    date: newDate ?? session.date,
    blocks: session.blocks.map((block) => ({
      ...block,
      durationSec:
        block.durationSec !== undefined
          ? Math.max(MIN_BLOCK_SECONDS, Math.round(block.durationSec * ratio))
          : block.durationSec,
    })),
  }
}

/** Replaces one session inside a plan (wherever its week is) and recomputes
 * that week's target load, keeping the two values from drifting apart. */
export function replaceSessionInPlan(plan: TrainingPlan, updatedSession: PlannedSession): TrainingPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((week) => {
      if (!week.sessions.some((s) => s.id === updatedSession.id)) return week
      const sessions = week.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      return { ...week, sessions, targetLoad: estimateWeekLoad(sessions) }
    }),
  }
}

/** Removes a session from its week entirely (used for REMOVE decisions)
 * and recomputes that week's target load. */
export function removeSessionFromPlan(plan: TrainingPlan, sessionId: string): TrainingPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((week) => {
      if (!week.sessions.some((s) => s.id === sessionId)) return week
      const sessions = week.sessions.filter((s) => s.id !== sessionId)
      return { ...week, sessions, targetLoad: estimateWeekLoad(sessions) }
    }),
  }
}
