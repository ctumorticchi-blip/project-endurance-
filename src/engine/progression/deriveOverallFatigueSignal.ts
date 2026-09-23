import type { SessionFeedback } from '@/core/history/SessionFeedback'

/** Same window/threshold philosophy as `engine/adaptation/decideAdaptation.ts`'s
 * own recent-RPE trend — a single high-RPE session is not "accumulated
 * fatigue", a consistent recent trend is. Kept as its own small, duplicated
 * function rather than importing the adaptation engine's private helper:
 * this one reasons across *all* disciplines for the progression engine's
 * purposes, not one session's own recent history. */
const RECENT_WINDOW = 3
const MIN_ENTRIES_FOR_TREND = 2
const HIGH_RPE_THRESHOLD = 8

/**
 * Whether the athlete's overall recent training (any discipline, any
 * family) shows a consistent high-RPE trend — the signal
 * `decideProgressionResponse` uses to RECOVER (pause progression) rather
 * than reacting to any single family's own last exposure in isolation.
 */
export function deriveOverallFatigueSignal(recentFeedback: SessionFeedback[]): boolean {
  const withRpe = recentFeedback
    .filter((f) => f.rpe !== undefined)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, RECENT_WINDOW)
  if (withRpe.length < MIN_ENTRIES_FOR_TREND) return false
  const avg = withRpe.reduce((sum, f) => sum + (f.rpe ?? 0), 0) / withRpe.length
  return avg >= HIGH_RPE_THRESHOLD
}
