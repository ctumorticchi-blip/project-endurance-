import type { MenuEntry } from '@/engine/nutrition/buildDailyMenu'
import type { MealSlot } from '@/config/nutrition/mealCatalog'
import { Card } from '@/shared/components/Card'

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
}

function MealCard({ entry }: { entry: MenuEntry }) {
  return (
    <Card as="li" variant="muted" className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
        {SLOT_LABELS[entry.slot]}
      </p>
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
    </Card>
  )
}

export function DailyMenuSection({ entries }: { entries: MenuEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Aucune proposition de menu disponible pour aujourd'hui avec tes préférences actuelles.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <MealCard key={entry.slot} entry={entry} />
      ))}
    </ul>
  )
}
