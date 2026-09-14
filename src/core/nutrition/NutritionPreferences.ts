export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescetarian'

export type DietaryRestriction = 'gluten-free' | 'lactose-free' | 'nut-free'

export type BudgetTier = 'tight' | 'moderate' | 'comfortable' | 'high'

export const DIET_TYPE_LABELS: Record<DietType, string> = {
  omnivore: 'Omnivore',
  vegetarian: 'Végétarien',
  vegan: 'Végan',
  pescetarian: 'Pescétarien',
}

export const RESTRICTION_LABELS: Record<DietaryRestriction, string> = {
  'gluten-free': 'Sans gluten',
  'lactose-free': 'Sans lactose',
  'nut-free': 'Sans fruits à coque',
}

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  tight: 'Serré (< 40€/semaine)',
  moderate: 'Modéré (40 à 70€/semaine)',
  comfortable: 'Confortable (70 à 100€/semaine)',
  high: 'Large (> 100€/semaine)',
}

/**
 * Declared once (interactively, from the Nutrition tab — not buried in the
 * main onboarding), editable anytime, never required to see general
 * guidance. Drives `engine/nutrition/buildDailyMenu.ts`: diet type and
 * restrictions are hard safety filters, budget is a soft preference (see
 * that module's doc comment for why budget never overrides safety).
 */
export interface NutritionPreferences {
  id: string
  createdAt: string
  dietType: DietType
  restrictions: DietaryRestriction[]
  budgetTier: BudgetTier
}

export function createNutritionPreferences(
  input: Omit<NutritionPreferences, 'id' | 'createdAt'>,
): NutritionPreferences {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}
