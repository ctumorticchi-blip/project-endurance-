import type { CompletedSession } from '@/core/history/CompletedSession'
import type { TrainingPlan } from '@/core/training/TrainingPlan'
import type { DateISO } from '@/shared/types/common'
import { addDays, mondayOf, toISODate } from '@/shared/utils/date'

export interface WeekSummary {
  /** Monday of the summarized week. */
  weekStart: DateISO
  plannedCount: number
  completedCount: number
  plannedMinutes: number
  actualMinutes: number
}

/**
 * A recap of the last *fully elapsed* calendar week (the one right before
 * the week containing `now`) — adherence (planned vs completed sessions)
 * and volume (planned vs actual minutes). Returns `undefined` when that
 * week isn't covered by the plan (e.g. the program just started this
 * week), rather than fabricating a summary for a week that never existed.
 */
export function buildLastWeekSummary(
  plan: TrainingPlan,
  completedSessions: CompletedSession[],
  now: Date,
): WeekSummary | undefined {
  const thisWeekStart = toISODate(mondayOf(now))
  const lastWeekStart = addDays(thisWeekStart, -7)
  const week = plan.weeks.find((w) => w.startDate === lastWeekStart)
  if (!week) return undefined

  const completedIds = new Set(completedSessions.map((c) => c.plannedSessionId))
  const completedInWeek = week.sessions.filter((s) => completedIds.has(s.id))
  const actualMinutes = completedSessions
    .filter((c) => week.sessions.some((s) => s.id === c.plannedSessionId))
    .reduce((sum, c) => sum + (c.actualDurationMin ?? 0), 0)

  return {
    weekStart: week.startDate,
    plannedCount: week.sessions.length,
    completedCount: completedInWeek.length,
    plannedMinutes: week.sessions.reduce((sum, s) => sum + s.estimatedDurationMin, 0),
    actualMinutes,
  }
}
