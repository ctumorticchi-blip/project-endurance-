import { useState } from 'react'
import { getMealAlternatives, type MenuEntry } from '@/engine/nutrition/buildDailyMenu'
import type { MealSlot } from '@/config/nutrition/mealCatalog'
import type { NutritionPreferences } from '@/core/nutrition/NutritionPreferences'
import type { DateISO } from '@/shared/types/common'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: '🍳 Petit-déjeuner',
  lunch: '🥗 Déjeuner',
  dinner: '🍝 Dîner',
  snack: '🍎 Collation',
}

interface MealCardProps {
  date: DateISO
  entry: MenuEntry
  preferences: NutritionPreferences
  onOverride: (date: DateISO, slot: MealSlot, mealId: string) => void
}

function MealCard({ date, entry, preferences, onOverride }: MealCardProps) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<string>()

  const alternatives = getMealAlternatives(entry.slot, preferences)

  const handleOpen = () => {
    setChoice(entry.meal.id)
    setOpen(true)
  }

  const handleConfirm = () => {
    if (!choice || choice === entry.meal.id) {
      setOpen(false)
      return
    }
    onOverride(date, entry.slot, choice)
    setOpen(false)
  }

  return (
    <Card as="li" variant="muted" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
          {SLOT_LABELS[entry.slot]}
        </p>
        {!open && alternatives.length > 1 && (
          <button
            type="button"
            onClick={handleOpen}
            className="shrink-0 text-xs font-medium text-accent underline"
          >
            Changer
          </button>
        )}
      </div>
      <p className="text-sm font-semibold">{entry.meal.title}</p>
      <ul className="flex flex-col gap-1">
        {entry.meal.items.map((item) => (
          <li key={item.food} className="flex justify-between text-xs text-text-muted">
            <span>{item.food}</span>
            <span>{item.portion}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted">{entry.meal.rationale}</p>
      {entry.contextNote && <p className="text-xs font-medium text-accent">{entry.contextNote}</p>}

      {open && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-border bg-surface p-3">
          <ChoiceGroup
            legend="Autres propositions"
            name={`meal-alternatives-${date}-${entry.slot}`}
            choices={alternatives.map((m) => ({ value: m.id, label: m.title }))}
            value={choice}
            onChange={setChoice}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Confirmer
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

interface DailyMenuSectionProps {
  date: DateISO
  entries: MenuEntry[]
  preferences: NutritionPreferences
  onOverride: (date: DateISO, slot: MealSlot, mealId: string) => void
}

export function DailyMenuSection({ date, entries, preferences, onOverride }: DailyMenuSectionProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Aucune proposition de menu disponible pour ce jour avec tes préférences actuelles.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <MealCard key={entry.slot} date={date} entry={entry} preferences={preferences} onOverride={onOverride} />
      ))}
    </ul>
  )
}
