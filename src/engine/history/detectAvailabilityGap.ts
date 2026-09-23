import type { Availability } from '@/core/availability/Availability'
import type { SessionFeedback } from '@/core/history/SessionFeedback'

/** Need at least this many recent feedback entries before drawing any
 * conclusion — a couple of missed sessions is noise, not a pattern. */
const MIN_ENTRIES = 8
const LOW_COMPLETION_THRESHOLD = 0.7

export interface AvailabilityGapResult {
  hasGap: boolean
  declaredSessionsPerWeek: number
  suggestedSessionsPerWeek: number
  /** Declared weekly training hours, from the weekly pattern alone. */
  declaredWeeklyHours: number
  /**
   * Estimated *sustainable* weekly hours — `declaredWeeklyHours` scaled by
   * the same completion-rate evidence as `suggestedSessionsPerWeek`, not a
   * separately reconstructed per-week total (feedback entries don't carry
   * enough date information to bucket them into calendar weeks reliably,
   * and a ratio-based estimate avoids fabricating a precision the data
   * can't support). Equal to `declaredWeeklyHours` whenever `hasGap` is
   * false. This is Training Intelligence V2's "declared vs. observed
   * capacity" distinction (brief §5) — COACHING_HEURISTIC.
   */
  observedWeeklyHours: number
  /** Ready-to-display message (brief §30) — undefined when there's no gap. */
  suggestion?: string
}

/**
 * Compares the athlete's *declared* weekly availability against how often
 * they actually complete sessions, using a simple completion-rate signal
 * rather than precise calendar-week bucketing (feedback entries don't
 * carry their own date — only the session they refer to does). Never
 * concludes anything from a handful of data points (brief §30).
 */
export function detectAvailabilityGap(
  availability: Availability,
  feedbackHistory: SessionFeedback[],
): AvailabilityGapResult {
  const declaredSessionsPerWeek = Object.values(availability.weeklyPattern).filter(
    (day) => day.available && day.minutes > 0,
  ).length
  const declaredWeeklyHours =
    Object.values(availability.weeklyPattern)
      .filter((day) => day.available)
      .reduce((sum, day) => sum + day.minutes, 0) / 60

  const recent = feedbackHistory.slice(-MIN_ENTRIES)
  if (recent.length < MIN_ENTRIES) {
    return {
      hasGap: false,
      declaredSessionsPerWeek,
      suggestedSessionsPerWeek: declaredSessionsPerWeek,
      declaredWeeklyHours,
      observedWeeklyHours: declaredWeeklyHours,
    }
  }

  const completedCount = recent.filter((f) => f.outcome === 'completed' || f.outcome === 'partial').length
  const completionRate = completedCount / recent.length

  if (completionRate >= LOW_COMPLETION_THRESHOLD) {
    return {
      hasGap: false,
      declaredSessionsPerWeek,
      suggestedSessionsPerWeek: declaredSessionsPerWeek,
      declaredWeeklyHours,
      observedWeeklyHours: declaredWeeklyHours,
    }
  }

  const suggestedSessionsPerWeek = Math.max(1, Math.round(declaredSessionsPerWeek * completionRate))
  const observedWeeklyHours = Math.round(declaredWeeklyHours * completionRate * 10) / 10
  return {
    hasGap: true,
    declaredSessionsPerWeek,
    suggestedSessionsPerWeek,
    declaredWeeklyHours,
    observedWeeklyHours,
    suggestion:
      `Ton programme semble trop chargé pour ton emploi du temps. Je te propose de passer à ` +
      `${suggestedSessionsPerWeek} séance${suggestedSessionsPerWeek > 1 ? 's' : ''} hebdomadaires ` +
      `tout en conservant les séances prioritaires.`,
  }
}
