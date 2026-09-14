import { describe, expect, it } from 'vitest'
import { getFuelingGuidance } from './nutritionGuidance'

describe('getFuelingGuidance', () => {
  it('gives a rest-day message when there is no session', () => {
    const result = getFuelingGuidance(undefined)
    expect(result.title).toBe('Jour de repos')
  })

  it('needs no special fueling during a short session', () => {
    const result = getFuelingGuidance({ discipline: 'run', estimatedDurationMin: 40 })
    expect(result.during).toMatch(/Pas besoin/)
  })

  it('suggests light fueling for a medium-length session', () => {
    const result = getFuelingGuidance({ discipline: 'bike', estimatedDurationMin: 75 })
    expect(result.during).toMatch(/collation/)
  })

  it('gives a carbs-per-hour range for a long bike or run session', () => {
    const result = getFuelingGuidance({ discipline: 'bike', estimatedDurationMin: 120 })
    expect(result.during).toMatch(/glucides par heure/)
  })

  it('notes that fueling during a long swim is impractical instead of giving a carbs-per-hour figure', () => {
    const result = getFuelingGuidance({ discipline: 'swim', estimatedDurationMin: 120 })
    expect(result.during).toMatch(/difficile de s'alimenter/)
    expect(result.during).not.toMatch(/glucides par heure/)
  })
})
