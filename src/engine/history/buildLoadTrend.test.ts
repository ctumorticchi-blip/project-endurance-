import { describe, expect, it } from 'vitest'
import type { CompletedSession } from '@/core/history/CompletedSession'
import { createPlannedSession, type PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPlan } from '@/core/training/TrainingPlan'
import { buildLoadTrend } from './buildLoadTrend'

function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return createPlannedSession({
    discipline: 'run',
    sessionType: 'endurance', // intensity factor 0.7
    title: 'Sortie',
    objective: '',
    blocks: [],
    estimatedDurationMin: 60,
    priority: 'key',
    date: '2026-06-08',
    weekId: 'week-1',
    ...overrides,
  })
}

function completedAt(iso: string, plannedSessionId: string, minutes: number): CompletedSession {
  return { id: iso, plannedSessionId, completedAt: iso, actualDurationMin: minutes }
}

describe('buildLoadTrend', () => {
  it('returns the requested number of weeks, oldest first, ending with the current week', () => {
    const plan: TrainingPlan = { id: 'p', raceGoalId: 'r', createdAt: '', weeks: [], warnings: [] }
    const now = new Date('2026-06-17T12:00:00Z') // a Wednesday
    const points = buildLoadTrend(plan, [], now, 3)

    expect(points).toHaveLength(3)
    expect(points[0]?.weekStart).toBe('2026-06-01')
    expect(points[1]?.weekStart).toBe('2026-06-08')
    expect(points[2]?.weekStart).toBe('2026-06-15')
  })

  it("reads plannedLoad from the plan week's own targetLoad, 0 outside the plan", () => {
    const plan: TrainingPlan = {
      id: 'p',
      raceGoalId: 'r',
      createdAt: '',
      weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 140, sessions: [] }],
      warnings: [],
    }
    const now = new Date('2026-06-17T12:00:00Z')
    const points = buildLoadTrend(plan, [], now, 3)

    expect(points[0]?.plannedLoad).toBe(0) // week of 06-01: not in the plan
    expect(points[1]?.plannedLoad).toBe(140) // week of 06-08: the plan week
    expect(points[2]?.plannedLoad).toBe(0) // week of 06-15: not in the plan
  })

  it('computes actualLoad from completed sessions using the matching planned session intensity, not the raw plan load', () => {
    const s = session({ sessionType: 'threshold' }) // intensity factor 1.0
    const plan: TrainingPlan = {
      id: 'p',
      raceGoalId: 'r',
      createdAt: '',
      weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 999, sessions: [s] }],
      warnings: [],
    }
    const now = new Date('2026-06-17T12:00:00Z')
    const completed = [completedAt('2026-06-09T09:00:00Z', s.id, 50)]
    const points = buildLoadTrend(plan, completed, now, 2)

    expect(points[0]?.actualLoad).toBe(50) // 50 min * 1.0 intensity, week of 06-08
  })

  it('ignores a completed session with no matching planned session (never crashes, never counts phantom load)', () => {
    const plan: TrainingPlan = { id: 'p', raceGoalId: 'r', createdAt: '', weeks: [], warnings: [] }
    const now = new Date('2026-06-17T12:00:00Z')
    const completed = [completedAt('2026-06-16T09:00:00Z', 'unknown-session', 50)]
    const points = buildLoadTrend(plan, completed, now, 1)

    expect(points[0]?.actualLoad).toBe(0)
  })
})
