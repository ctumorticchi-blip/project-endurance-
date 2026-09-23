import { describe, expect, it } from 'vitest'
import { createPlannedSession, type PlannedSession } from '@/core/training/PlannedSession'
import { explainSession } from './explainSession'

function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'threshold',
    title: 'Seuil vélo',
    objective: 'Objectif générique',
    estimatedDurationMin: 60,
    priority: 'key',
    date: '2026-01-05',
    weekId: 'week-1',
    blocks: [],
    ...overrides,
  })
}

describe('explainSession', () => {
  it('returns undefined when the session carries no familyId (older plans, or a sport without Workout Families)', () => {
    expect(explainSession(session({ familyId: undefined }))).toBeUndefined()
  })

  it('returns undefined for an unrecognised familyId rather than throwing', () => {
    expect(explainSession(session({ familyId: 'NOT_A_REAL_FAMILY' }))).toBeUndefined()
  })

  it('builds the headline from the real Workout Family explanation, never a generic template', () => {
    const explanation = explainSession(session({ familyId: 'BIKE_THRESHOLD' }))
    expect(explanation).toBeDefined()
    expect(explanation!.headline).toContain('FTP')
    expect(explanation!.trainingPurpose).toBeTruthy()
    expect(explanation!.physiologicalIntent).toBeTruthy()
  })

  it('adds a placement note only when the session actually carries a recognised reason code', () => {
    const withReason = explainSession(session({ familyId: 'BIKE_THRESHOLD', reasonCodes: ['ANCHOR_SESSION'] }))
    expect(withReason!.placementNote).toBeDefined()

    const withoutReason = explainSession(session({ familyId: 'BIKE_THRESHOLD', reasonCodes: undefined }))
    expect(withoutReason!.placementNote).toBeUndefined()

    const unknownReason = explainSession(session({ familyId: 'BIKE_THRESHOLD', reasonCodes: ['SOME_UNKNOWN_CODE'] }))
    expect(unknownReason!.placementNote).toBeUndefined()
  })
})
