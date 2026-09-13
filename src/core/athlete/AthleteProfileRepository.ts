import { createVersionedStore, storage } from '@/shared/storage'
import type { AthleteProfile } from './AthleteProfile'

const store = createVersionedStore<AthleteProfile>({
  storage,
  key: 'athlete-profile',
  currentVersion: 1,
})

export const AthleteProfileRepository = {
  load: store.load,
  save: store.save,
  clear: store.clear,
}
