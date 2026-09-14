import { describe, expect, it } from 'vitest'
import type { DietaryRestriction, DietType } from '@/core/nutrition/NutritionPreferences'
import { getMealById, getMealsBySlot, MEAL_CATALOG, type MealSlot } from './mealCatalog'

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
const DIETS: DietType[] = ['omnivore', 'vegetarian', 'vegan', 'pescetarian']

describe('MEAL_CATALOG', () => {
  it('has unique ids', () => {
    const ids = MEAL_CATALOG.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers every slot with at least one meal', () => {
    for (const slot of SLOTS) {
      expect(getMealsBySlot(slot).length).toBeGreaterThan(0)
    }
  })

  it('lists every declared item with a non-empty portion', () => {
    for (const meal of MEAL_CATALOG) {
      expect(meal.items.length).toBeGreaterThan(0)
      for (const item of meal.items) {
        expect(item.food.length).toBeGreaterThan(0)
        expect(item.portion.length).toBeGreaterThan(0)
      }
    }
  })

  it('gives every meal a non-empty rationale', () => {
    for (const meal of MEAL_CATALOG) {
      expect(meal.rationale.length).toBeGreaterThan(0)
    }
  })

  it('every slot has a vegan + gluten-free + nut-free option (the strictest realistic combination)', () => {
    const restrictions: DietaryRestriction[] = ['gluten-free', 'nut-free']
    for (const slot of SLOTS) {
      const hasStrictOption = getMealsBySlot(slot).some(
        (m) =>
          m.compatibleDiets.includes('vegan') &&
          !restrictions.some((r) => (r === 'gluten-free' ? m.containsGluten : m.containsNuts)),
      )
      expect(hasStrictOption, `no vegan+gluten-free+nut-free option for ${slot}`).toBe(true)
    }
  })

  it('every diet can find at least one safe meal in every slot with no restrictions', () => {
    for (const slot of SLOTS) {
      for (const diet of DIETS) {
        const hasOption = getMealsBySlot(slot).some((m) => m.compatibleDiets.includes(diet))
        expect(hasOption, `no meal for diet=${diet} slot=${slot}`).toBe(true)
      }
    }
  })

  it('a vegan meal is never tagged as containing lactose', () => {
    for (const meal of MEAL_CATALOG) {
      if (meal.compatibleDiets.includes('vegan')) {
        expect(meal.containsLactose, `${meal.id} claims vegan-compatible but contains lactose`).toBe(false)
      }
    }
  })

  it('every slot has at least one cheap-tier option', () => {
    for (const slot of SLOTS) {
      expect(getMealsBySlot(slot).some((m) => m.costTier === 'cheap')).toBe(true)
    }
  })
})

describe('getMealById', () => {
  it('finds a known meal', () => {
    expect(getMealById('lunch-riz-lentilles')?.title).toBe('Riz complet, lentilles corail, légumes, curcuma')
  })

  it('returns undefined for an unknown id', () => {
    expect(getMealById('does-not-exist')).toBeUndefined()
  })
})
