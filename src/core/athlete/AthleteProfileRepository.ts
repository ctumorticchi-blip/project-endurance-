import { createVersionedStore, storage } from '@/shared/storage'
import type { AthleteProfile } from './AthleteProfile'

const store = createVersionedStore<AthleteProfile>({
  storage,
  key: 'athlete-profile',
  currentVersion: 2,
  migrations: [
    {
      // `biometrics` was added as a required field after profiles were
      // already being saved (v1 had no such field at all) — without this,
      // every profile created before that change loads back with
      // `biometrics` simply missing and crashes the first component that
      // reads it (ProfilePage, Nutrition). Backfilling an empty object is
      // exactly what a fresh onboarding would have produced if the field
      // had existed and been left blank (it's fully optional).
      fromVersion: 1,
      migrate: (data) => {
        const profile = data as Omit<AthleteProfile, 'biometrics'> & {
          biometrics?: AthleteProfile['biometrics']
        }
        return { ...profile, biometrics: profile.biometrics ?? {} }
      },
    },
  ],
})

export const AthleteProfileRepository = {
  load: store.load,
  save: store.save,
  clear: store.clear,
}
