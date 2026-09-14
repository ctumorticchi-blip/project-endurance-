import type { NutritionPreferences } from '@/core/nutrition/NutritionPreferences'
import { findSessionForDate, type TrainingPlan } from '@/core/training/TrainingPlan'
import type { DateISO } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { buildDailyMenu, type DailyMenu } from './buildDailyMenu'

/**
 * The same deterministic daily menu, once per calendar day of the week
 * starting at `weekStart` — never a separate selection logic, just
 * `buildDailyMenu` called across 7 dates so the day and week views always
 * agree with each other. Looks a day ahead across the week boundary too
 * (Sunday's "tomorrow" is next week's Monday), same as the Today screen.
 */
export function buildWeeklyMenu(
  plan: TrainingPlan,
  weekStart: DateISO,
  preferences: NutritionPreferences,
): DailyMenu[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const session = findSessionForDate(plan, date)
    const nextSession = findSessionForDate(plan, addDays(date, 1))
    return buildDailyMenu({ date, session, nextSession, preferences })
  })
}
