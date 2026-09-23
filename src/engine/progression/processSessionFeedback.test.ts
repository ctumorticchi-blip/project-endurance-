import { describe, expect, it } from 'vitest'
import { createInitialProgressionState } from '@/core/coaching/progressionState'
import type { WorkoutFamily } from '@/core/coaching/workoutFamily'
import type { PlannedSession } from '@/core/training/PlannedSession'
import { processSessionFeedback } from './processSessionFeedback'

const FAMILY: WorkoutFamily = {
  id: 'RUN_THRESHOLD',
  discipline: 'run',
  sessionType: 'threshold',
  trainingPurpose: 'test',
  physiologicalIntent: 'test',
  appropriatePhases: ['build'],
  raceFormatRelevance: {},
  progressionLevels: 5,
  defaultPriority: 'KEY_A',
  fatigueCost: 'high',
  recoveryRequirement: 1,
  fallbackPrescription: 'RPE',
  explanation: 'test',
  evidenceClassification: 'EVIDENCE_BASED',
}

function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    id: 's1',
    discipline: 'run',
    sessionType: 'threshold',
    title: 'Seuil course',
    objective: 'test',
    blocks: [
      { id: 'b1', label: 'warmup', durationSec: 600, targetRpeMin: 2, targetRpeMax: 3 },
      { id: 'b2', label: 'threshold', durationSec: 1200, targetRpeMin: 7, targetRpeMax: 8 },
    ],
    estimatedDurationMin: 45,
    plannedDurationMin: 45,
    plannedBlocks: [],
    priority: 'key',
    date: '2026-06-01',
    weekId: 'week-1',
    ...overrides,
  }
}

describe('processSessionFeedback', () => {
  it('records an exposure and progresses the family when RPE was lower than the hardest block target', () => {
    const { nextState, response } = processSessionFeedback({
      session: session(),
      outcome: 'completed',
      actualRpe: 5, // hardest block target midpoint is 7.5
      family: FAMILY,
      currentState: createInitialProgressionState(FAMILY.id, 2),
      recentFeedback: [],
    })
    expect(response.decision).toBe('PROGRESS')
    expect(nextState.currentLevel).toBe(3)
    expect(nextState.history).toHaveLength(1)
    expect(nextState.history[0]!.targetRpe).toBe(7.5)
  })

  it('regresses the family when RPE was much higher than the hardest block target', () => {
    const { nextState, response } = processSessionFeedback({
      session: session(),
      outcome: 'completed',
      actualRpe: 9.5,
      family: FAMILY,
      currentState: createInitialProgressionState(FAMILY.id, 3),
      recentFeedback: [],
    })
    expect(response.decision).toBe('REGRESS')
    expect(nextState.currentLevel).toBe(2)
  })

  it('recovers (pauses progression) when recent overall feedback shows high fatigue, regardless of this exposure', () => {
    const highFatigueFeedback = [
      { id: 'f1', plannedSessionId: 'x', outcome: 'completed' as const, rpe: 9, createdAt: '2026-05-01T00:00:00Z' },
      { id: 'f2', plannedSessionId: 'y', outcome: 'completed' as const, rpe: 9, createdAt: '2026-05-02T00:00:00Z' },
    ]
    const { response } = processSessionFeedback({
      session: session(),
      outcome: 'completed',
      actualRpe: 5, // would otherwise PROGRESS
      family: FAMILY,
      currentState: createInitialProgressionState(FAMILY.id, 2),
      recentFeedback: highFatigueFeedback,
    })
    expect(response.decision).toBe('RECOVER')
  })

  it('records a missed exposure without progressing or regressing', () => {
    const { nextState, response } = processSessionFeedback({
      session: session(),
      outcome: 'missed',
      family: FAMILY,
      currentState: createInitialProgressionState(FAMILY.id, 2),
      recentFeedback: [],
    })
    expect(response.decision).toBe('MAINTAIN')
    expect(nextState.currentLevel).toBe(2)
    expect(nextState.history[0]!.outcome).toBe('missed')
  })
})
