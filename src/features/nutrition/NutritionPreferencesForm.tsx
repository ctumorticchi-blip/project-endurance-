import { useState } from 'react'
import {
  BUDGET_TIER_LABELS,
  createNutritionPreferences,
  DIET_TYPE_LABELS,
  RESTRICTION_LABELS,
  type BudgetTier,
  type DietaryRestriction,
  type DietType,
  type NutritionPreferences,
} from '@/core/nutrition/NutritionPreferences'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { CheckboxGroup } from '@/shared/components/CheckboxGroup'

const DIET_CHOICES: { value: DietType; label: string }[] = (
  ['omnivore', 'vegetarian', 'vegan', 'pescetarian'] as const
).map((value) => ({ value, label: DIET_TYPE_LABELS[value] }))

const RESTRICTION_CHOICES: { value: DietaryRestriction; label: string }[] = (
  ['gluten-free', 'lactose-free', 'nut-free'] as const
).map((value) => ({ value, label: RESTRICTION_LABELS[value] }))

const BUDGET_CHOICES: { value: BudgetTier; label: string }[] = (
  ['tight', 'moderate', 'comfortable', 'high'] as const
).map((value) => ({ value, label: BUDGET_TIER_LABELS[value] }))

interface NutritionPreferencesFormProps {
  initial?: NutritionPreferences
  onSaved: (preferences: NutritionPreferences) => void
  onCancel?: () => void
}

export function NutritionPreferencesForm({ initial, onSaved, onCancel }: NutritionPreferencesFormProps) {
  const [dietType, setDietType] = useState<DietType | undefined>(initial?.dietType ?? 'omnivore')
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(initial?.restrictions ?? [])
  const [budgetTier, setBudgetTier] = useState<BudgetTier | undefined>(initial?.budgetTier ?? 'moderate')

  const canSave = Boolean(dietType && budgetTier)

  const handleSave = () => {
    if (!dietType || !budgetTier) return
    onSaved(createNutritionPreferences({ dietType, restrictions, budgetTier }))
  }

  return (
    <Card variant="raised" className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold">Tes préférences alimentaires</h2>
        <p className="mt-1 text-xs text-text-muted">
          Utilisées uniquement pour te proposer des menus adaptés — jamais un diagnostic, jamais
          partagées. Modifiable à tout moment.
        </p>
      </div>

      <ChoiceGroup legend="Régime alimentaire" name="diet-type" choices={DIET_CHOICES} value={dietType} onChange={setDietType} />

      <CheckboxGroup
        legend="Allergies / intolérances à exclure"
        choices={RESTRICTION_CHOICES}
        value={restrictions}
        onChange={setRestrictions}
      />

      <ChoiceGroup
        legend="Budget alimentaire hebdomadaire (pour toi)"
        name="budget-tier"
        choices={BUDGET_CHOICES}
        value={budgetTier}
        onChange={setBudgetTier}
      />

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button onClick={handleSave} disabled={!canSave} className="flex-1">
          Enregistrer
        </Button>
      </div>
    </Card>
  )
}
