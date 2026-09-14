import type { MealSlot } from '@/config/nutrition/mealCatalog'
import type { DateISO } from '@/shared/types/common'

/** Keyed by `mealOverrideKey(date, slot)` -> the meal id the athlete
 * manually picked for that exact day+slot, overriding the engine's own
 * deterministic choice. */
export type MealOverrides = Record<string, string>

export function mealOverrideKey(date: DateISO, slot: MealSlot): string {
  return `${date}:${slot}`
}
