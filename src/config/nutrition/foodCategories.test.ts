import { describe, expect, it } from 'vitest'
import { MEAL_CATALOG } from './mealCatalog'
import { FOOD_CATEGORIES } from './foodCategories'

describe('FOOD_CATEGORIES', () => {
  it('maps every distinct food name used in the meal catalog — no silent pantry fallback', () => {
    const uncategorized = new Set<string>()
    for (const meal of MEAL_CATALOG) {
      for (const item of meal.items) {
        if (!(item.food in FOOD_CATEGORIES)) uncategorized.add(item.food)
      }
    }
    expect([...uncategorized]).toEqual([])
  })
})
