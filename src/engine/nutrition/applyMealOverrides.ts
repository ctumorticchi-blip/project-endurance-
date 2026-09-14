import { getMealById } from '@/config/nutrition/mealCatalog'
import { mealOverrideKey, type MealOverrides } from '@/core/nutrition/MealOverride'
import type { DailyMenu } from './buildDailyMenu'

/**
 * Applies any manual overrides on top of the engine's deterministic menu —
 * the override wins outright when present, dropping the original
 * `contextNote` since it was reasoned about the engine's own pick (e.g. "a
 * carb-heavy option") and may not describe what the athlete chose instead.
 */
export function applyMealOverrides(menu: DailyMenu, overrides: MealOverrides): DailyMenu {
  return {
    ...menu,
    entries: menu.entries.map((entry) => {
      const overrideId = overrides[mealOverrideKey(menu.date, entry.slot)]
      if (!overrideId) return entry
      const overriddenMeal = getMealById(overrideId)
      if (!overriddenMeal) return entry
      return { slot: entry.slot, meal: overriddenMeal }
    }),
  }
}
