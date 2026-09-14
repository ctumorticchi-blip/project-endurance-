import { getFoodCategory, type GroceryCategory } from '@/config/nutrition/foodCategories'
import type { DailyMenu } from './buildDailyMenu'
import { formatQuantity, parsePortion, type GroceryUnit } from './parsePortion'

export interface ShoppingListLine {
  food: string
  category: GroceryCategory
  /** e.g. "220 g", "2 cuillères à soupe + une pincée" — already formatted
   * for display, combining every summable unit plus any qualitative
   * portions verbatim (see `parsePortion.ts`). */
  quantityLabel: string
}

function describeQuantity(parsed: { amount: number; unit: GroceryUnit }[], qualitative: string[]): string {
  const totalByUnit = new Map<GroceryUnit, number>()
  for (const { amount, unit } of parsed) {
    totalByUnit.set(unit, (totalByUnit.get(unit) ?? 0) + amount)
  }
  const summedParts = [...totalByUnit.entries()].map(([unit, amount]) => formatQuantity(amount, unit))
  return [...summedParts, ...qualitative].join(' + ')
}

/**
 * Aggregates every meal's ingredients across the given daily menus (a
 * week, typically — pass menus already run through `applyMealOverrides`
 * so a last-minute swap is reflected here too) into one shopping list:
 * matching units summed into a single quantity per food, grouped by
 * grocery aisle. A food appearing with a qualitative portion ("une
 * pincée") is carried through as-is rather than fabricating a total —
 * see `parsePortion.ts`.
 */
export function buildShoppingList(menus: DailyMenu[]): ShoppingListLine[] {
  const parsedByFood = new Map<string, { amount: number; unit: GroceryUnit }[]>()
  const qualitativeByFood = new Map<string, string[]>()

  for (const menu of menus) {
    for (const entry of menu.entries) {
      for (const item of entry.meal.items) {
        const parsed = parsePortion(item.portion)
        if (parsed) {
          const list = parsedByFood.get(item.food) ?? []
          list.push(parsed)
          parsedByFood.set(item.food, list)
        } else {
          const list = qualitativeByFood.get(item.food) ?? []
          if (!list.includes(item.portion)) list.push(item.portion)
          qualitativeByFood.set(item.food, list)
        }
      }
    }
  }

  const foods = new Set([...parsedByFood.keys(), ...qualitativeByFood.keys()])

  return [...foods]
    .map((food) => ({
      food,
      category: getFoodCategory(food),
      quantityLabel: describeQuantity(parsedByFood.get(food) ?? [], qualitativeByFood.get(food) ?? []),
    }))
    .sort((a, b) => a.food.localeCompare(b.food, 'fr'))
}
