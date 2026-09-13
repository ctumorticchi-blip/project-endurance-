import { createVersionedStore, storage } from '@/shared/storage'
import type { Availability } from './Availability'

const store = createVersionedStore<Availability>({
  storage,
  key: 'availability',
  currentVersion: 1,
})

export const AvailabilityRepository = {
  load: store.load,
  save: store.save,
  clear: store.clear,
}
