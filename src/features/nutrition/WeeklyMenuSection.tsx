import type { MealOverrides } from '@/core/nutrition/MealOverride'
import type { NutritionPreferences } from '@/core/nutrition/NutritionPreferences'
import type { TrainingPlan } from '@/core/training/TrainingPlan'
import { applyMealOverrides } from '@/engine/nutrition/applyMealOverrides'
import { buildWeeklyMenu } from '@/engine/nutrition/buildWeeklyMenu'
import type { MealSlot } from '@/config/nutrition/mealCatalog'
import { Card } from '@/shared/components/Card'
import type { DateISO } from '@/shared/types/common'
import { DailyMenuSection } from './DailyMenuSection'

interface WeeklyMenuSectionProps {
  plan: TrainingPlan
  weekStart: DateISO
  today: DateISO
  preferences: NutritionPreferences
  overrides: MealOverrides
  onOverride: (date: DateISO, slot: MealSlot, mealId: string) => void
}

function formatDayHeading(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
}

/**
 * The same deterministic menus as "Ton menu du jour", laid out across the
 * whole current plan week — never a separate engine, just `buildDailyMenu`
 * (via `buildWeeklyMenu`) once per day, with the same manual-override and
 * swap capability on every meal card.
 */
export function WeeklyMenuSection({
  plan,
  weekStart,
  today,
  preferences,
  overrides,
  onOverride,
}: WeeklyMenuSectionProps) {
  const menus = buildWeeklyMenu(plan, weekStart, preferences).map((menu) => applyMealOverrides(menu, overrides))

  return (
    <div className="flex flex-col gap-4">
      {menus.map((menu) => (
        <Card key={menu.date} variant={menu.date === today ? 'raised' : 'default'} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold capitalize">
            {formatDayHeading(menu.date)}
            {menu.date === today ? ' · aujourd\'hui' : ''}
          </h3>
          <DailyMenuSection date={menu.date} entries={menu.entries} preferences={preferences} onOverride={onOverride} />
        </Card>
      ))}
    </div>
  )
}
