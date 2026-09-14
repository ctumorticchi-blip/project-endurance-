import { describe, expect, it } from 'vitest'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createPlannedSession, type PlannedSession } from '@/core/training/PlannedSession'
import { createTrainingPlan, type TrainingWeek } from '@/core/training/TrainingPlan'
import { replaceSessionInPlan } from '@/engine/adaptation/applyAdaptationToPlan'
import { swapSessionDiscipline } from './swapSessionDiscipline'

function bikeSession(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'endurance',
    title: 'Endurance vélo',
    objective: 'x',
    blocks: [],
    estimatedDurationMin: 70,
    priority: 'key',
    date: '2026-06-10', // a Wednesday
    weekId: 'week-1',
    ...overrides,
  })
}

function availabilityWithPool(minutes: number, pool: boolean): Availability {
  const pattern = createEmptyWeeklyPattern()
  pattern.wednesday = { available: true, minutes, poolAccess: pool }
  return { weeklyPattern: pattern, exceptions: [] }
}

function weekWith(sessions: PlannedSession[]): TrainingWeek {
  return { id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 0, sessions }
}

describe('swapSessionDiscipline', () => {
  it('swaps a bike session to swim when the pool is accessible that day', () => {
    const session = bikeSession()
    const result = swapSessionDiscipline(session, 'swim', {
      phase: 'base',
      week: weekWith([session]),
      availability: availabilityWithPool(70, true),
    })

    expect(result).toBeDefined()
    expect(result?.discipline).toBe('swim')
    expect(result?.date).toBe(session.date)
    expect(result?.weekId).toBe(session.weekId)
    expect(result?.priority).toBe(session.priority)
    // Critical: replaceSessionInPlan matches sessions by id, so a swap
    // that changes the id would silently fail to actually replace anything.
    expect(result?.id).toBe(session.id)
  })

  it('refuses to swap to swim without pool access that day', () => {
    const session = bikeSession()
    const result = swapSessionDiscipline(session, 'swim', {
      phase: 'base',
      week: weekWith([session]),
      availability: availabilityWithPool(70, false),
    })
    expect(result).toBeUndefined()
  })

  it('refuses to swap to the same discipline', () => {
    const session = bikeSession()
    const result = swapSessionDiscipline(session, 'bike', {
      phase: 'base',
      week: weekWith([session]),
      availability: availabilityWithPool(70, true),
    })
    expect(result).toBeUndefined()
  })

  it('returns undefined when no template of the target discipline fits the available time', () => {
    const session = bikeSession()
    const result = swapSessionDiscipline(session, 'swim', {
      phase: 'base',
      week: weekWith([session]),
      availability: availabilityWithPool(10, true),
    })
    expect(result).toBeUndefined()
  })

  it('uses the secondary (lighter) session type when the target discipline already has a session that week', () => {
    const session = bikeSession()
    const existingRun = createPlannedSession({
      discipline: 'run',
      sessionType: 'long',
      title: 'Sortie longue',
      objective: 'x',
      blocks: [],
      estimatedDurationMin: 60,
      priority: 'key',
      date: '2026-06-09',
      weekId: 'week-1',
    })
    const result = swapSessionDiscipline(session, 'run', {
      phase: 'base',
      week: weekWith([session, existingRun]),
      availability: availabilityWithPool(70, true),
    })
    expect(result).toBeDefined()
    // base phase: primary run type is 'long', secondary is 'endurance'.
    expect(result?.sessionType).toBe('endurance')
  })

  it('falls back to the session\'s own planned duration when no availability minutes are recorded for that date', () => {
    const session = bikeSession({ estimatedDurationMin: 45 })
    const emptyAvailability: Availability = { weeklyPattern: createEmptyWeeklyPattern(), exceptions: [] }
    const result = swapSessionDiscipline(session, 'strength', {
      phase: 'base',
      week: weekWith([session]),
      availability: emptyAvailability,
    })
    expect(result).toBeDefined()
    expect(result?.discipline).toBe('strength')
  })

  it('actually replaces the session in the plan via replaceSessionInPlan (end to end)', () => {
    const session = bikeSession()
    const plan = createTrainingPlan({
      raceGoalId: 'goal-1',
      warnings: [],
      weeks: [weekWith([session])],
    })
    const result = swapSessionDiscipline(session, 'swim', {
      phase: 'base',
      week: weekWith([session]),
      availability: availabilityWithPool(70, true),
    })
    expect(result).toBeDefined()

    const updatedPlan = replaceSessionInPlan(plan, result!)
    const updatedSession = updatedPlan.weeks[0]?.sessions.find((s) => s.id === session.id)
    expect(updatedSession?.discipline).toBe('swim')
    expect(updatedPlan.weeks[0]?.sessions).toHaveLength(1)
  })
})
