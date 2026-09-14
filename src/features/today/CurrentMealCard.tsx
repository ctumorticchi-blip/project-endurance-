import { Link } from 'react-router-dom'
import type { MealSlot } from '@/config/nutrition/mealCatalog'
import { MealOverrideRepository } from '@/core/nutrition/MealOverrideRepository'
import { NutritionPreferencesRepository } from '@/core/nutrition/NutritionPreferencesRepository'
import type { PlannedSession } from '@/core/training/PlannedSession'
import { applyMealOverrides } from '@/engine/nutrition/applyMealOverrides'
import { buildDailyMenu } from '@/engine/nutrition/buildDailyMenu'
import { currentMealSlot } from '@/engine/nutrition/currentMealSlot'
import { Card } from '@/shared/components/Card'
import type { DateISO } from '@/shared/types/common'

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: '🍳 petit-déjeuner',
  lunch: '🥗 déjeuner',
  dinner: '🍝 dîner',
  snack: '🍎 collation',
}

interface CurrentMealCardProps {
  date: DateISO
  session: PlannedSession | undefined
  nextSession: PlannedSession | undefined
}

/**
 * A compact, time-aware nudge for whichever meal makes sense right now —
 * pulled from the same deterministic daily menu Nutrition shows in full,
 * never duplicated logic. Says nothing before nutrition preferences are
 * declared (NutritionSetupPrompt already covers that separate nudge) or
 * outside the three meal windows.
 */
export function CurrentMealCard({ date, session, nextSession }: CurrentMealCardProps) {
  const preferences = NutritionPreferencesRepository.load()
  if (!preferences) return null

  const slot = currentMealSlot(new Date().getHours())
  if (!slot) return null

  const menu = applyMealOverrides(buildDailyMenu({ date, session, nextSession, preferences }), MealOverrideRepository.loadAll())
  const entry = menu.entries.find((e) => e.slot === slot)
  if (!entry) return null

  return (
    <Card variant="muted" className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
          C'est l'heure du {SLOT_LABELS[slot]}
        </p>
        <p className="text-sm font-semibold">{entry.meal.title}</p>
      </div>
      <Link
        to="/nutrition"
        className="shrink-0 text-xs font-medium text-accent underline whitespace-nowrap"
      >
        Voir le menu
      </Link>
    </Card>
  )
}
