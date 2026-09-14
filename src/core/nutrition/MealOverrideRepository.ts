import type { MealSlot } from '@/config/nutrition/mealCatalog'
import { createVersionedStore, storage } from '@/shared/storage'
import type { DateISO } from '@/shared/types/common'
import { mealOverrideKey, type MealOverrides } from './MealOverride'

const store = createVersionedStore<MealOverrides>({
  storage,
  key: 'meal-overrides',
  currentVersion: 1,
})

export const MealOverrideRepository = {
  loadAll(): MealOverrides {
    return store.load() ?? {}
  },
  set(date: DateISO, slot: MealSlot, mealId: string): void {
    store.save({ ...(store.load() ?? {}), [mealOverrideKey(date, slot)]: mealId })
  },
  clear(): void {
    store.clear()
  },
}
