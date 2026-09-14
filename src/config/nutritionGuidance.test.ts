import { describe, expect, it } from 'vitest'
import { getFuelingGuidance, getNutritionDisclaimer } from './nutritionGuidance'

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

  it('falls back to a generic duration-only carb/fluid range when no weight is declared', () => {
    const result = getFuelingGuidance({ discipline: 'run', estimatedDurationMin: 120 })
    expect(result.during).toMatch(/30 à 60 g/)
    expect(result.during).toMatch(/500 à 750 ml/)
  })

  it('computes a carb/fluid range from the declared body weight for a long session', () => {
    const result = getFuelingGuidance({ discipline: 'bike', estimatedDurationMin: 150 }, 70)
    // 70kg * 0.6-1.0 g/kg/h = 42-70g ; 70kg * 6-8 ml/kg/h = 420-560ml
    expect(result.during).toMatch(/42 à 70 g/)
    expect(result.during).toMatch(/420 à 560 ml/)
    expect(result.during).toMatch(/70 kg/)
  })

  it('still gives the swim impracticality note even when a weight is declared', () => {
    const result = getFuelingGuidance({ discipline: 'swim', estimatedDurationMin: 120 }, 70)
    expect(result.during).toMatch(/difficile de s'alimenter/)
  })
})

describe('getNutritionDisclaimer', () => {
  it('says weight is unknown when none was declared', () => {
    expect(getNutritionDisclaimer(false)).toMatch(/ne connaît pas ton poids/)
  })

  it('says the guidance is weight-calculated once a weight is declared', () => {
    expect(getNutritionDisclaimer(true)).toMatch(/calculés à partir de ton poids/)
  })
})
