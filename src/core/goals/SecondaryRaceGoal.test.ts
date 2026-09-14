import { describe, expect, it } from 'vitest'
import { createSecondaryRaceGoal } from './SecondaryRaceGoal'

describe('createSecondaryRaceGoal', () => {
  it('assigns an id and createdAt, keeping distance optional', () => {
    const race = createSecondaryRaceGoal({ raceName: 'Triathlon de Nice', raceDate: '2026-09-01' })
    expect(race.id).toBeTruthy()
    expect(race.createdAt).toBeTruthy()
    expect(race.raceName).toBe('Triathlon de Nice')
    expect(race.distance).toBeUndefined()
  })

  it('keeps a declared distance', () => {
    const race = createSecondaryRaceGoal({
      raceName: 'Triathlon B',
      raceDate: '2026-09-01',
      distance: 'sprint',
    })
    expect(race.distance).toBe('sprint')
  })
})
