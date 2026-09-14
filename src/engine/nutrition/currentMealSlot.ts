import type { MealSlot } from '@/config/nutrition/mealCatalog'

/**
 * Coarse time-of-day windows for "which meal makes sense right now" (Today
 * screen nudge) — as specified: breakfast 5h-11h, lunch 11h-16h, dinner
 * 16h-22h. Outside all three (late night / very early morning), nothing is
 * shown rather than guessing.
 */
export function currentMealSlot(hour: number): MealSlot | undefined {
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 16 && hour < 22) return 'dinner'
  return undefined
}
