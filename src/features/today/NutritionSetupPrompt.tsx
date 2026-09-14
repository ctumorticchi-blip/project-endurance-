import { Link } from 'react-router-dom'
import { NutritionPreferencesRepository } from '@/core/nutrition/NutritionPreferencesRepository'
import { Card } from '@/shared/components/Card'

/**
 * Surfaced on Today rather than only inside the Nutrition tab itself
 * (brief feedback: the in-tab prompt is easy to miss if someone never
 * opens Nutrition) — a nudge, not a gate: dismissible by simply going
 * elsewhere, never blocks the rest of the app. Disappears for good once
 * preferences are saved.
 */
export function NutritionSetupPrompt() {
  const preferences = NutritionPreferencesRepository.load()
  if (preferences) return null

  return (
    <Card variant="muted" className="flex items-center justify-between gap-3">
      <p className="text-sm">
        Personnalise tes menus nutrition (régime, allergies, budget) pour des propositions
        adaptées à toi.
      </p>
      <Link
        to="/nutrition"
        className="shrink-0 text-xs font-semibold text-accent underline whitespace-nowrap"
      >
        Configurer
      </Link>
    </Card>
  )
}
