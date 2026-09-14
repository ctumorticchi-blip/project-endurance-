import type { CompletedSession } from '@/core/history/CompletedSession'
import { allSessions, type TrainingPlan } from '@/core/training/TrainingPlan'
import { INTENSITY_FACTOR } from '@/engine/metrics/load'
import type { DateISO } from '@/shared/types/common'
import { mondayOf, MS_PER_WEEK, toISODate } from '@/shared/utils/date'

export interface LoadTrendPoint {
  /** Monday of that week. */
  weekStart: DateISO
  /** The plan's own `targetLoad` for that calendar week — 0 for a week
   * outside the generated plan (before it started, or past its last week). */
  plannedLoad: number
  /** Same `duration * intensity factor` formula as `estimateSessionLoad`,
   * applied to what was actually completed (looked up by the session it was
   * planned against) rather than what was planned — so the two numbers are
   * directly comparable, not apples to oranges. */
  actualLoad: number
}

/**
 * Plan-adherence over time: for each of the last `weekCount` calendar weeks,
 * how much load was planned versus how much was actually completed. Reuses
 * `estimateWeekLoad`'s own formula (duration × a fixed intensity factor per
 * session type — see `engine/metrics/load.ts`) so this stays the same
 * "relative, decomposable, no false precision" unit already used to build
 * the plan itself, not a second, incompatible metric.
 */
export function buildLoadTrend(
  plan: TrainingPlan,
  completedSessions: CompletedSession[],
  now: Date,
  weekCount = 8,
): LoadTrendPoint[] {
  const sessionsById = new Map(allSessions(plan).map((s) => [s.id, s]))
  const currentWeekStart = mondayOf(now).getTime()
  const points: LoadTrendPoint[] = []

  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStartMs = currentWeekStart - i * MS_PER_WEEK
    const weekStartISO = toISODate(new Date(weekStartMs))
    const weekEndMs = weekStartMs + MS_PER_WEEK

    const planWeek = plan.weeks.find((w) => w.startDate === weekStartISO)

    const actualLoad = completedSessions
      .filter((c) => {
        const t = new Date(c.completedAt).getTime()
        return t >= weekStartMs && t < weekEndMs
      })
      .reduce((sum, c) => {
        const planned = sessionsById.get(c.plannedSessionId)
        if (!planned) return sum
        return sum + Math.round((c.actualDurationMin ?? 0) * INTENSITY_FACTOR[planned.sessionType])
      }, 0)

    points.push({ weekStart: weekStartISO, plannedLoad: planWeek?.targetLoad ?? 0, actualLoad })
  }

  return points
}
