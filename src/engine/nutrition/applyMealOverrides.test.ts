import { describe, expect, it } from 'vitest'
import { getMealsBySlot } from '@/config/nutrition/mealCatalog'
import { mealOverrideKey } from '@/core/nutrition/MealOverride'
import { createNutritionPreferences } from '@/core/nutrition/NutritionPreferences'
import { applyMealOverrides } from './applyMealOverrides'
import { buildDailyMenu } from './buildDailyMenu'

const PREFERENCES = createNutritionPreferences({ dietType: 'omnivore', restrictions: [], budgetTier: 'moderate' })

describe('applyMealOverrides', () => {
  it('leaves the menu untouched when there is no matching override', () => {
    const menu = buildDailyMenu({ date: '2026-06-10', session: undefined, nextSession: undefined, preferences: PREFERENCES })
    const result = applyMealOverrides(menu, {})
    expect(result).toEqual(menu)
  })

  it('replaces the entry for an overridden slot with the chosen meal, dropping the context note', () => {
    const menu = buildDailyMenu({ date: '2026-06-10', session: undefined, nextSession: undefined, preferences: PREFERENCES })
    const lunchOptions = getMealsBySlot('lunch')
    const original = menu.entries.find((e) => e.slot === 'lunch')!.meal
    const alternative = lunchOptions.find((m) => m.id !== original.id)!

    const overrides = { [mealOverrideKey('2026-06-10', 'lunch')]: alternative.id }
    const result = applyMealOverrides(menu, overrides)

    const lunch = result.entries.find((e) => e.slot === 'lunch')
    expect(lunch?.meal.id).toBe(alternative.id)
    expect(lunch?.contextNote).toBeUndefined()

    // Other slots are untouched.
    const breakfast = result.entries.find((e) => e.slot === 'breakfast')
    expect(breakfast?.meal.id).toBe(menu.entries.find((e) => e.slot === 'breakfast')?.meal.id)
  })

  it('ignores an override pointing at an unknown meal id rather than crashing', () => {
    const menu = buildDailyMenu({ date: '2026-06-10', session: undefined, nextSession: undefined, preferences: PREFERENCES })
    const overrides = { [mealOverrideKey('2026-06-10', 'lunch')]: 'does-not-exist' }
    const result = applyMealOverrides(menu, overrides)
    expect(result).toEqual(menu)
  })

  it('ignores an override for a different date', () => {
    const menu = buildDailyMenu({ date: '2026-06-10', session: undefined, nextSession: undefined, preferences: PREFERENCES })
    const overrides = { [mealOverrideKey('2026-06-11', 'lunch')]: 'anything' }
    const result = applyMealOverrides(menu, overrides)
    expect(result).toEqual(menu)
  })
})
