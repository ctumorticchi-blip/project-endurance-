import { describe, expect, it } from 'vitest'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createCompletedSession } from '@/core/history/CompletedSession'
import { createSessionFeedback } from '@/core/history/SessionFeedback'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { createTrainingPlan } from '@/core/training/TrainingPlan'
import type { AdaptationDecision } from '@/engine/adaptation/AdaptationDecision'
import { buildProgressSummary } from './buildProgressSummary'

function emptyAvailability(): Availability {
  return { weeklyPattern: createEmptyWeeklyPattern(), exceptions: [] }
}

function planWithSessions() {
  const bike = createPlannedSession({
    discipline: 'bike',
    sessionType: 'endurance',
    title: 'Bike',
    objective: 'x',
    blocks: [],
    estimatedDurationMin: 60,
    priority: 'key',
    date: '2026-06-01',
    weekId: 'week-1',
  })
  const run = createPlannedSession({
    discipline: 'run',
    sessionType: 'endurance',
    title: 'Run',
    objective: 'x',
    blocks: [],
    estimatedDurationMin: 40,
    priority: 'key',
    date: '2026-06-02',
    weekId: 'week-1',
  })
  const plan = createTrainingPlan({
    raceGoalId: 'g',
    warnings: [],
    weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-01', phase: 'base', targetLoad: 100, sessions: [bike, run] }],
  })
  return { plan, bike, run }
}

describe('buildProgressSummary', () => {
  it('sums completed minutes and breaks them down by discipline', () => {
    const { plan, bike, run } = planWithSessions()
    const completedSessions = [
      createCompletedSession({ plannedSessionId: bike.id, actualDurationMin: 55 }),
      createCompletedSession({ plannedSessionId: run.id, actualDurationMin: 35 }),
    ]
    const summary = buildProgressSummary({
      plan,
      completedSessions,
      feedback: [],
      availability: emptyAvailability(),
      adaptationDecisions: [],
    })

    expect(summary.totalCompletedSessions).toBe(2)
    expect(summary.totalMinutes).toBe(90)
    expect(summary.disciplineMinutes.bike).toBe(55)
    expect(summary.disciplineMinutes.run).toBe(35)
  })

  it('does not compute a consistency rate from too little feedback', () => {
    const { plan } = planWithSessions()
    const summary = buildProgressSummary({
      plan,
      completedSessions: [],
      feedback: [createSessionFeedback({ plannedSessionId: 'x', outcome: 'missed' })],
      availability: emptyAvailability(),
      adaptationDecisions: [],
    })
    expect(summary.consistencyRate).toBeUndefined()
  })

  it('computes a consistency rate once there is enough feedback history', () => {
    const { plan } = planWithSessions()
    const feedback = [
      createSessionFeedback({ plannedSessionId: 'x', outcome: 'completed' }),
      createSessionFeedback({ plannedSessionId: 'x', outcome: 'completed' }),
      createSessionFeedback({ plannedSessionId: 'x', outcome: 'partial' }),
      createSessionFeedback({ plannedSessionId: 'x', outcome: 'missed' }),
      createSessionFeedback({ plannedSessionId: 'x', outcome: 'missed' }),
    ]
    const summary = buildProgressSummary({
      plan,
      completedSessions: [],
      feedback,
      availability: emptyAvailability(),
      adaptationDecisions: [],
    })
    expect(summary.consistencyRate).toBeCloseTo(0.6)
  })

  it('suggests continuing to log data when there is too little history for any insight', () => {
    const { plan } = planWithSessions()
    const summary = buildProgressSummary({
      plan,
      completedSessions: [],
      feedback: [],
      availability: emptyAvailability(),
      adaptationDecisions: [],
    })
    expect(summary.learnedInsight).toMatch(/Continue à enregistrer/)
  })

  it('lists the most recent adaptation decisions first', () => {
    const { plan } = planWithSessions()
    const decisions: AdaptationDecision[] = [
      { type: 'KEEP', sessionId: 'a', reasons: ['NO_SIGNAL'], before: { estimatedDurationMin: 1 }, after: { estimatedDurationMin: 1 }, explanation: 'first' },
      { type: 'REDUCE', sessionId: 'b', reasons: ['ELEVATED_FATIGUE'], before: { estimatedDurationMin: 2 }, after: { estimatedDurationMin: 1 }, explanation: 'second' },
    ]
    const summary = buildProgressSummary({
      plan,
      completedSessions: [],
      feedback: [],
      availability: emptyAvailability(),
      adaptationDecisions: decisions,
    })
    expect(summary.recentAdaptations[0]?.explanation).toBe('second')
  })
})
