import { createListStore, storage } from '@/shared/storage'
import type { ReadinessCheck } from './ReadinessCheck'

const store = createListStore<ReadinessCheck>({
  storage,
  key: 'readiness-checks',
  currentVersion: 1,
})

export const ReadinessCheckRepository = {
  loadAll: store.loadAll,
  append: store.append,
  clear: store.clear,
}
