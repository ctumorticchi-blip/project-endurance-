import { createVersionedStore, storage } from '@/shared/storage'
import type { TrainingPlan } from './TrainingPlan'

const store = createVersionedStore<TrainingPlan>({
  storage,
  key: 'training-plan',
  currentVersion: 1,
})

export const TrainingPlanRepository = {
  load: store.load,
  save: store.save,
  clear: store.clear,
}
