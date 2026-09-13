import { describe, expect, it } from 'vitest'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { createTrainingPlan } from '@/core/training/TrainingPlan'
import type { AdaptationDecision } from './AdaptationDecision'
import { applyDurationAdaptation, removeSessionFromPlan, replaceSessionInPlan } from './applyAdaptationToPlan'

function buildSession() {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'sweet-spot',
    title: 'Sweet Spot vélo',
    objective: 'Objectif',
    estimatedDurationMin: 60,
    priority: 'key',
    date: '2026-06-10',
    weekId: 'week-1',
    blocks: [
      { id: 'warmup', label: 'Échauffement', durationSec: 600, targetRpeMin: 2, targetRpeMax: 4 },
      { id: 'main', label: 'Bloc principal', durationSec: 2400, targetRpeMin: 6, targetRpeMax: 7 },
    ],
  })
}

describe('applyDurationAdaptation', () => {
  it('scales every block by the same before/after ratio', () => {
    const session = buildSession()
    const decision: AdaptationDecision = {
      type: 'REDUCE',
      sessionId: session.id,
      reasons: ['ELEVATED_FATIGUE'],
      before: { estimatedDurationMin: 60 },
      after: { estimatedDurationMin: 30 },
      explanation: 'test',
    }

    const updated = applyDurationAdaptation(session, decision)
    expect(updated.estimatedDurationMin).toBe(30)
    expect(updated.blocks[0]?.durationSec).toBe(300)
    expect(updated.blocks[1]?.durationSec).toBe(1200)
  })

  it('moves the session to a new date when the decision includes one', () => {
    const session = buildSession()
    const decision: AdaptationDecision = {
      type: 'MOVE',
      sessionId: session.id,
      reasons: ['KEY_SESSION_PROTECTED'],
      before: { estimatedDurationMin: 60, date: '2026-06-10' },
      after: { estimatedDurationMin: 60, date: '2026-06-12' },
      explanation: 'test',
    }
    const updated = applyDurationAdaptation(session, decision)
    expect(updated.date).toBe('2026-06-12')
    expect(updated.blocks[0]?.durationSec).toBe(session.blocks[0]?.durationSec)
  })

  it('is a no-op when nothing actually changed (KEEP)', () => {
    const session = buildSession()
    const decision: AdaptationDecision = {
      type: 'KEEP',
      sessionId: session.id,
      reasons: ['NO_SIGNAL'],
      before: { estimatedDurationMin: 60 },
      after: { estimatedDurationMin: 60 },
      explanation: 'test',
    }
    expect(applyDurationAdaptation(session, decision)).toBe(session)
  })
})

describe('replaceSessionInPlan', () => {
  it('replaces the session in its week and recomputes that week\'s load', () => {
    const session = buildSession()
    const plan = createTrainingPlan({
      raceGoalId: 'goal-1',
      warnings: [],
      weeks: [
        { id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'build', targetLoad: 999, sessions: [session] },
      ],
    })

    const updatedSession = { ...session, estimatedDurationMin: 30 }
    const updatedPlan = replaceSessionInPlan(plan, updatedSession)

    expect(updatedPlan.weeks[0]?.sessions[0]?.estimatedDurationMin).toBe(30)
    expect(updatedPlan.weeks[0]?.targetLoad).not.toBe(999)
  })

  it('leaves other weeks untouched', () => {
    const session = buildSession()
    const otherSession = { ...buildSession(), id: 'other', weekId: 'week-2' }
    const plan = createTrainingPlan({
      raceGoalId: 'goal-1',
      warnings: [],
      weeks: [
        { id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'build', targetLoad: 42, sessions: [session] },
        { id: 'week-2', weekNumber: 2, startDate: '2026-06-15', phase: 'build', targetLoad: 42, sessions: [otherSession] },
      ],
    })
    const updated = replaceSessionInPlan(plan, { ...session, estimatedDurationMin: 10 })
    expect(updated.weeks[1]).toBe(plan.weeks[1])
  })
})

describe('removeSessionFromPlan', () => {
  it('removes the session and recomputes the week load', () => {
    const session = buildSession()
    const plan = createTrainingPlan({
      raceGoalId: 'goal-1',
      warnings: [],
      weeks: [
        { id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'build', targetLoad: 42, sessions: [session] },
      ],
    })
    const updated = removeSessionFromPlan(plan, session.id)
    expect(updated.weeks[0]?.sessions).toHaveLength(0)
    expect(updated.weeks[0]?.targetLoad).toBe(0)
  })
})
