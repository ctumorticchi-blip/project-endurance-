import { describe, expect, it } from 'vitest'
import { createRaceGoal, daysUntilRace, weeksUntilRace } from './RaceGoal'

describe('createRaceGoal', () => {
  it('stamps sport, id and createdAt', () => {
    const goal = createRaceGoal({ distance: 'sprint', raceDate: '2026-12-01' })
    expect(goal.sport).toBe('triathlon')
    expect(goal.id).toBeTruthy()
    expect(goal.createdAt).toBeTruthy()
  })
})

describe('daysUntilRace', () => {
  it('returns 0 for today', () => {
    const today = new Date('2026-06-01T15:00:00Z')
    expect(daysUntilRace('2026-06-01', today)).toBe(0)
  })

  it('counts whole days ahead regardless of time of day', () => {
    const today = new Date('2026-06-01T23:59:00Z')
    expect(daysUntilRace('2026-06-08', today)).toBe(7)
  })

  it('never returns a negative number for a past date', () => {
    const today = new Date('2026-06-10T00:00:00Z')
    expect(daysUntilRace('2026-06-01', today)).toBe(0)
  })
})

describe('weeksUntilRace', () => {
  it('floors to whole weeks', () => {
    const today = new Date('2026-06-01T00:00:00Z')
    expect(weeksUntilRace('2026-06-10', today)).toBe(1)
    expect(weeksUntilRace('2026-06-15', today)).toBe(2)
  })
})
