import { describe, expect, it } from 'vitest'
import { createAthleteProfile } from './AthleteProfile'

describe('createAthleteProfile', () => {
  it('generates a unique id and createdAt timestamp', () => {
    const profile = createAthleteProfile({
      generalSportExperience: 'beginner',
      triathlonExperience: 'first-triathlon',
      disciplineLevels: { swim: 'beginner', bike: 'beginner', run: 'beginner' },
      equipment: { hasPoolAccess: false, hasBike: true, hasHomeTrainer: false },
      knownMetrics: {},
    })

    expect(profile.id).toBeTruthy()
    expect(profile.createdAt).toBeTruthy()
    expect(profile.disciplineLevels.swim).toBe('beginner')
  })

  it('does not require any known metric', () => {
    const profile = createAthleteProfile({
      generalSportExperience: 'advanced',
      triathlonExperience: 'experienced',
      disciplineLevels: { swim: 'advanced', bike: 'advanced', run: 'advanced' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: true },
      knownMetrics: {},
    })

    expect(profile.knownMetrics).toEqual({})
  })
})
