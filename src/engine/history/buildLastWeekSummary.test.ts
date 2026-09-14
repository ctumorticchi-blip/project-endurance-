import { describe, expect, it } from 'vitest'
import type { CompletedSession } from '@/core/history/CompletedSession'
import { createPlannedSession, type PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPlan } from '@/core/training/TrainingPlan'
import { buildLastWeekSummary } from './buildLastWeekSummary'

function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return createPlannedSession({
    discipline: 'run',
    sessionType: 'endurance',
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

function completedFor(plannedSessionId: string, minutes: number): CompletedSession {
  return { id: plannedSessionId, plannedSessionId, completedAt: '2026-06-09T09:00:00Z', actualDurationMin: minutes }
}

describe('buildLastWeekSummary', () => {
  it('returns undefined when the plan has no week starting last Monday', () => {
    const plan: TrainingPlan = { id: 'p', raceGoalId: 'r', createdAt: '', weeks: [], warnings: [] }
    const now = new Date('2026-06-17T12:00:00Z') // a Wednesday, last Monday is 2026-06-08
    expect(buildLastWeekSummary(plan, [], now)).toBeUndefined()
  })

  it('counts planned vs completed sessions and minutes for the week right before the current one', () => {
    const s1 = session()
    const s2 = session({ date: '2026-06-09' })
    const plan: TrainingPlan = {
      id: 'p',
      raceGoalId: 'r',
      createdAt: '',
      weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 0, sessions: [s1, s2] }],
      warnings: [],
    }
    const now = new Date('2026-06-17T12:00:00Z')
    const summary = buildLastWeekSummary(plan, [completedFor(s1.id, 55)], now)

    expect(summary?.weekStart).toBe('2026-06-08')
    expect(summary?.plannedCount).toBe(2)
    expect(summary?.completedCount).toBe(1)
    expect(summary?.plannedMinutes).toBe(120)
    expect(summary?.actualMinutes).toBe(55)
  })

  it('ignores completed sessions that belong to a different week', () => {
    const s1 = session()
    const plan: TrainingPlan = {
      id: 'p',
      raceGoalId: 'r',
      createdAt: '',
      weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 0, sessions: [s1] }],
      warnings: [],
    }
    const now = new Date('2026-06-17T12:00:00Z')
    const summary = buildLastWeekSummary(plan, [completedFor('some-other-session', 40)], now)

    expect(summary?.completedCount).toBe(0)
    expect(summary?.actualMinutes).toBe(0)
  })
})
