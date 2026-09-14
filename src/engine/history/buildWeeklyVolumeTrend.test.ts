import { describe, expect, it } from 'vitest'
import type { CompletedSession } from '@/core/history/CompletedSession'
import { buildWeeklyVolumeTrend } from './buildWeeklyVolumeTrend'

function completedAt(iso: string, minutes: number): CompletedSession {
  return { id: iso, plannedSessionId: 'x', completedAt: iso, actualDurationMin: minutes }
}

describe('buildWeeklyVolumeTrend', () => {
  it('returns the requested number of weeks, oldest first, ending with the current week', () => {
    const now = new Date('2026-06-17T12:00:00Z') // a Wednesday
    const points = buildWeeklyVolumeTrend([], now, 3)

    expect(points).toHaveLength(3)
    expect(points[0]?.weekStart).toBe('2026-06-01') // two weeks before
    expect(points[1]?.weekStart).toBe('2026-06-08')
    expect(points[2]?.weekStart).toBe('2026-06-15') // Monday of the current week
  })

  it('sums minutes per week from completedAt, not the plan', () => {
    const now = new Date('2026-06-17T12:00:00Z')
    const sessions = [
      completedAt('2026-06-08T09:00:00Z', 40),
      completedAt('2026-06-09T09:00:00Z', 30),
      completedAt('2026-06-16T09:00:00Z', 60),
    ]
    const points = buildWeeklyVolumeTrend(sessions, now, 3)

    expect(points[0]?.minutes).toBe(0) // week of 06-01: nothing
    expect(points[1]?.minutes).toBe(70) // week of 06-08: 40 + 30
    expect(points[2]?.minutes).toBe(60) // week of 06-15: 60
  })

  it('returns real zeros for weeks with no completed sessions instead of omitting them', () => {
    const now = new Date('2026-06-17T12:00:00Z')
    const points = buildWeeklyVolumeTrend([], now, 6)
    expect(points.every((p) => p.minutes === 0)).toBe(true)
    expect(points).toHaveLength(6)
  })

  it('ignores sessions with no recorded duration', () => {
    const now = new Date('2026-06-17T12:00:00Z')
    const sessions: CompletedSession[] = [{ id: 'a', plannedSessionId: 'x', completedAt: '2026-06-16T09:00:00Z' }]
    const points = buildWeeklyVolumeTrend(sessions, now, 1)
    expect(points[0]?.minutes).toBe(0)
  })
})
