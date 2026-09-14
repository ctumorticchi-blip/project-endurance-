import { createVersionedStore, storage } from '@/shared/storage'
import type { NutritionPreferences } from './NutritionPreferences'

const store = createVersionedStore<NutritionPreferences>({
  storage,
  key: 'nutrition-preferences',
  currentVersion: 1,
})

export const NutritionPreferencesRepository = {
  load: store.load,
  save: store.save,
  clear: store.clear,
}
