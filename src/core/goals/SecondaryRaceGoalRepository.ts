import { createListStore, storage } from '@/shared/storage'
import type { SecondaryRaceGoal } from './SecondaryRaceGoal'

const store = createListStore<SecondaryRaceGoal>({
  storage,
  key: 'secondary-race-goals',
  currentVersion: 1,
})

export const SecondaryRaceGoalRepository = {
  loadAll: store.loadAll,
  append: store.append,
  replaceAll: store.replaceAll,
  clear: store.clear,
}
