import { describe, expect, it } from 'vitest'
import { createAthleteProfile } from './AthleteProfile'

describe('createAthleteProfile', () => {
  it('generates a unique id and createdAt timestamp', () => {
    const profile = createAthleteProfile({
      sport: 'triathlon',
      generalSportExperience: 'beginner',
      triathlonExperience: 'first-triathlon',
      disciplineLevels: { swim: 'beginner', bike: 'beginner', run: 'beginner' },
      equipment: { hasPoolAccess: false, hasBike: true, hasHomeTrainer: false },
      knownMetrics: {},
      biometrics: {},
    })

    expect(profile.id).toBeTruthy()
    expect(profile.createdAt).toBeTruthy()
    expect(profile.disciplineLevels.swim).toBe('beginner')
  })

  it('does not require any known metric', () => {
    const profile = createAthleteProfile({
      sport: 'triathlon',
      generalSportExperience: 'advanced',
      triathlonExperience: 'experienced',
      disciplineLevels: { swim: 'advanced', bike: 'advanced', run: 'advanced' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: true },
      knownMetrics: {},
      biometrics: {},
    })

    expect(profile.knownMetrics).toEqual({})
  })

  it('does not require any biometric', () => {
    const profile = createAthleteProfile({
      sport: 'triathlon',
      generalSportExperience: 'advanced',
      triathlonExperience: 'experienced',
      disciplineLevels: { swim: 'advanced', bike: 'advanced', run: 'advanced' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: true },
      knownMetrics: {},
      biometrics: {},
    })

    expect(profile.biometrics).toEqual({})
  })

  it('accepts a declared sex, height and weight', () => {
    const profile = createAthleteProfile({
      sport: 'triathlon',
      generalSportExperience: 'intermediate',
      triathlonExperience: 'some-races',
      disciplineLevels: { swim: 'intermediate', bike: 'intermediate', run: 'intermediate' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
      knownMetrics: {},
      biometrics: { sex: 'female', heightCm: 168, weightKg: 60 },
    })

    expect(profile.biometrics).toEqual({ sex: 'female', heightCm: 168, weightKg: 60 })
  })
})
