import { GROCERY_CATEGORY_LABELS, GROCERY_CATEGORY_ORDER } from '@/config/nutrition/foodCategories'
import type { MealOverrides } from '@/core/nutrition/MealOverride'
import type { NutritionPreferences } from '@/core/nutrition/NutritionPreferences'
import type { TrainingPlan } from '@/core/training/TrainingPlan'
import { applyMealOverrides } from '@/engine/nutrition/applyMealOverrides'
import { buildShoppingList } from '@/engine/nutrition/buildShoppingList'
import { buildWeeklyMenu } from '@/engine/nutrition/buildWeeklyMenu'
import { Card } from '@/shared/components/Card'
import type { DateISO } from '@/shared/types/common'

interface ShoppingListSectionProps {
  plan: TrainingPlan
  weekStart: DateISO
  preferences: NutritionPreferences
  overrides: MealOverrides
}

/**
 * The week's meal proposals turned into a real shopping list: quantities
 * summed food by food (`buildShoppingList.ts`), grouped by grocery aisle
 * like a dietitian would lay it out. Built from the same overridden menu
 * as the "Semaine" view, so swapping a meal at the last minute updates
 * the list too — there is no separate "shopping list state" to fall out
 * of sync.
 */
export function ShoppingListSection({ plan, weekStart, preferences, overrides }: ShoppingListSectionProps) {
  const menus = buildWeeklyMenu(plan, weekStart, preferences).map((menu) => applyMealOverrides(menu, overrides))
  const lines = buildShoppingList(menus)

  if (lines.length === 0) {
    return <p className="text-xs text-text-muted">Rien à prévoir pour cette semaine.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Calculée à partir du menu de cette semaine — se met à jour automatiquement si tu changes un
        repas.
      </p>
      {GROCERY_CATEGORY_ORDER.filter((category) => lines.some((line) => line.category === category)).map(
        (category) => (
          <Card key={category} variant="muted" className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{GROCERY_CATEGORY_LABELS[category]}</h3>
            <ul className="flex flex-col gap-1.5">
              {lines
                .filter((line) => line.category === category)
                .map((line) => (
                  <li key={line.food} className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{line.food}</span>
                    <span className="shrink-0 text-text-muted">{line.quantityLabel}</span>
                  </li>
                ))}
            </ul>
          </Card>
        ),
      )}
    </div>
  )
}
