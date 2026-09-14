import { describe, expect, it } from 'vitest'
import { createNutritionPreferences } from './NutritionPreferences'

describe('createNutritionPreferences', () => {
  it('generates a unique id and createdAt timestamp', () => {
    const prefs = createNutritionPreferences({
      dietType: 'omnivore',
      restrictions: [],
      budgetTier: 'moderate',
    })
    expect(prefs.id).toBeTruthy()
    expect(prefs.createdAt).toBeTruthy()
    expect(prefs.dietType).toBe('omnivore')
  })

  it('keeps declared restrictions', () => {
    const prefs = createNutritionPreferences({
      dietType: 'vegan',
      restrictions: ['gluten-free', 'nut-free'],
      budgetTier: 'tight',
    })
    expect(prefs.restrictions).toEqual(['gluten-free', 'nut-free'])
  })
})
