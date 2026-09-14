import type { CompletedSession } from '@/core/history/CompletedSession'
import type { DateISO } from '@/shared/types/common'
import { toISODate } from '@/shared/utils/date'

export interface WeeklyVolumePoint {
  /** Monday of that week. */
  weekStart: DateISO
  minutes: number
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function mondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Buckets completed sessions by the Monday-starting week they finished in,
 * returning the last `weekCount` weeks oldest-first, ending with the week
 * containing `now`. A week with nothing logged is a real zero — it is
 * still returned, not skipped, because "no training that week" is itself
 * the signal (brief: no false precision, but no hidden gaps either).
 */
export function buildWeeklyVolumeTrend(
  completedSessions: CompletedSession[],
  now: Date,
  weekCount = 6,
): WeeklyVolumePoint[] {
  const currentWeekStart = mondayOf(now).getTime()
  const points: WeeklyVolumePoint[] = []

  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStartMs = currentWeekStart - i * MS_PER_WEEK
    const weekEndMs = weekStartMs + MS_PER_WEEK
    const minutes = completedSessions
      .filter((s) => {
        const t = new Date(s.completedAt).getTime()
        return t >= weekStartMs && t < weekEndMs
      })
      .reduce((sum, s) => sum + (s.actualDurationMin ?? 0), 0)
    points.push({ weekStart: toISODate(new Date(weekStartMs)), minutes })
  }

  return points
}
