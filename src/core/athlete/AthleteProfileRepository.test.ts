import { describe, expect, it } from 'vitest'
import { storage } from '@/shared/storage'
import { AthleteProfileRepository } from './AthleteProfileRepository'
import { createAthleteProfile } from './AthleteProfile'

const STORAGE_KEY = 'athlete-profile'

describe('AthleteProfileRepository', () => {
  it('round-trips a current-shape profile, biometrics included', () => {
    const profile = createAthleteProfile({
      sport: 'triathlon',
      generalSportExperience: 'intermediate',
      triathlonExperience: 'some-races',
      disciplineLevels: { swim: 'intermediate', bike: 'intermediate', run: 'intermediate' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
      knownMetrics: { ftpWatts: 220 },
      biometrics: { sex: 'male', heightCm: 180, weightKg: 75 },
    })
    AthleteProfileRepository.save(profile)
    expect(AthleteProfileRepository.load()).toEqual(profile)
  })

  it('backfills an empty biometrics object for a profile saved before biometrics existed (v1, real production data)', () => {
    // Simulates exactly what shipped before this feature: a profile with
    // no `biometrics` key at all, stored under the v1 schema. Without the
    // migration, ProfilePage/NutritionPage crash trying to read it.
    const legacyProfile = {
      id: 'legacy-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      sport: 'triathlon',
      generalSportExperience: 'beginner',
      triathlonExperience: 'first-triathlon',
      disciplineLevels: { swim: 'beginner', bike: 'beginner', run: 'beginner' },
      equipment: { hasPoolAccess: false, hasBike: true, hasHomeTrainer: false },
      knownMetrics: {},
    }
    storage.set(STORAGE_KEY, { version: 1, data: legacyProfile })

    const loaded = AthleteProfileRepository.load()
    expect(loaded?.biometrics).toEqual({})
    expect(loaded?.id).toBe('legacy-1')
  })

  it('preserves already-declared biometrics found on a v1 record instead of wiping them', () => {
    const legacyProfileWithBiometrics = {
      id: 'legacy-2',
      createdAt: '2026-01-01T00:00:00.000Z',
      sport: 'triathlon',
      generalSportExperience: 'advanced',
      triathlonExperience: 'experienced',
      disciplineLevels: { swim: 'advanced', bike: 'advanced', run: 'advanced' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: true },
      knownMetrics: {},
      biometrics: { sex: 'female', heightCm: 165, weightKg: 58 },
    }
    storage.set(STORAGE_KEY, { version: 1, data: legacyProfileWithBiometrics })

    expect(AthleteProfileRepository.load()?.biometrics).toEqual({
      sex: 'female',
      heightCm: 165,
      weightKg: 58,
    })
  })
})
