import { createVersionedStore, storage } from '@/shared/storage'
import type { RaceGoal } from './RaceGoal'

const store = createVersionedStore<RaceGoal>({
  storage,
  key: 'race-goal',
  currentVersion: 1,
})

export const RaceGoalRepository = {
  load: store.load,
  save: store.save,
  clear: store.clear,
}
