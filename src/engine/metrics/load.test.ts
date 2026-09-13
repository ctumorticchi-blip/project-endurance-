import { describe, expect, it } from 'vitest'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { estimateLoadByDiscipline, estimateSessionLoad, estimateWeekLoad } from './load'

function session(overrides: Partial<Parameters<typeof createPlannedSession>[0]> = {}) {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'endurance',
    title: 'Test',
    objective: 'Test',
    blocks: [],
    estimatedDurationMin: 60,
    priority: 'secondary',
    date: '2026-06-01',
    weekId: 'week-1',
    ...overrides,
  })
}

describe('estimateSessionLoad', () => {
  it('scales with both duration and intensity', () => {
    expect(estimateSessionLoad(session({ estimatedDurationMin: 60, sessionType: 'endurance' }))).toBe(42)
    expect(estimateSessionLoad(session({ estimatedDurationMin: 60, sessionType: 'vo2max' }))).toBe(72)
  })

  it('a longer easy session can carry less load than a shorter hard one', () => {
    const longEasy = estimateSessionLoad(session({ estimatedDurationMin: 90, sessionType: 'recovery' }))
    const shortHard = estimateSessionLoad(session({ estimatedDurationMin: 40, sessionType: 'vo2max' }))
    expect(longEasy).toBeLessThan(shortHard)
  })
})

describe('estimateWeekLoad', () => {
  it('sums the load of every session', () => {
    const sessions = [
      session({ estimatedDurationMin: 60, sessionType: 'endurance' }),
      session({ estimatedDurationMin: 30, sessionType: 'recovery' }),
    ]
    expect(estimateWeekLoad(sessions)).toBe(
      estimateSessionLoad(sessions[0]!) + estimateSessionLoad(sessions[1]!),
    )
  })
})

describe('estimateLoadByDiscipline', () => {
  it('groups load per discipline', () => {
    const sessions = [
      session({ discipline: 'bike', estimatedDurationMin: 60, sessionType: 'endurance' }),
      session({ discipline: 'run', estimatedDurationMin: 30, sessionType: 'recovery' }),
      session({ discipline: 'bike', estimatedDurationMin: 20, sessionType: 'vo2max' }),
    ]
    const byDiscipline = estimateLoadByDiscipline(sessions)
    expect(byDiscipline.run).toBe(estimateSessionLoad(sessions[1]!))
    expect(byDiscipline.bike).toBe(
      estimateSessionLoad(sessions[0]!) + estimateSessionLoad(sessions[2]!),
    )
  })
})
