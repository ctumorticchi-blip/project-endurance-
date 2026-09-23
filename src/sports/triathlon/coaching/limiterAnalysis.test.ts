import { describe, expect, it } from 'vitest'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import { analyzeLimiters } from './limiterAnalysis'

function profileWith(levels: { swim: 'beginner' | 'intermediate' | 'advanced'; bike: 'beginner' | 'intermediate' | 'advanced'; run: 'beginner' | 'intermediate' | 'advanced' }, knownMetrics: Parameters<typeof createAthleteProfile>[0]['knownMetrics'] = {}) {
  return createAthleteProfile({
    sport: 'triathlon',
    generalSportExperience: 'intermediate',
    triathlonExperience: 'some-races',
    disciplineLevels: levels,
    equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
    knownMetrics,
    biometrics: {},
  })
}

describe('analyzeLimiters', () => {
  it('identifies the weakest discipline as the limiter and the strongest as strongest', () => {
    const profile = profileWith({ swim: 'beginner', bike: 'intermediate', run: 'advanced' })
    const result = analyzeLimiters(profile)
    expect(result.limiter).toBe('swim')
    expect(result.strongest).toBe('run')
    expect(result.isBalanced).toBe(false)
  })

  it('the Gold Standard shape — weak/intermediate swim, intermediate bike, good run — flags swim as the limiter', () => {
    const profile = profileWith({ swim: 'beginner', bike: 'intermediate', run: 'advanced' })
    const result = analyzeLimiters(profile)
    expect(result.limiter).toBe('swim')
    expect(result.explanation).toMatch(/natation/)
    expect(result.explanation).toMatch(/course/)
  })

  it('flags a balanced athlete when all three disciplines share the same level', () => {
    const profile = profileWith({ swim: 'intermediate', bike: 'intermediate', run: 'intermediate' })
    const result = analyzeLimiters(profile)
    expect(result.isBalanced).toBe(true)
    expect(result.explanation).toMatch(/équilibrée/)
  })

  it('breaks a limiter tie in favor of calling out swim first', () => {
    const profile = profileWith({ swim: 'beginner', bike: 'beginner', run: 'advanced' })
    const result = analyzeLimiters(profile)
    expect(result.limiter).toBe('swim')
  })

  it('breaks a strength tie in favor of protecting run', () => {
    const profile = profileWith({ swim: 'beginner', bike: 'advanced', run: 'advanced' })
    const result = analyzeLimiters(profile)
    expect(result.strongest).toBe('run')
  })

  it('records which disciplines have a tested metric known, without letting it override the declared level', () => {
    const profile = profileWith(
      { swim: 'beginner', bike: 'intermediate', run: 'advanced' },
      { cssSecPer100m: 100, ftpWatts: 220 },
    )
    const result = analyzeLimiters(profile)
    expect(result.hasTestedMetric).toEqual({ swim: true, bike: true, run: false })
    expect(result.limiter).toBe('swim') // unaffected by the CSS test being known
  })

  it('degrades gracefully when swim/bike levels are somehow missing (defaults to beginner)', () => {
    const profile = createAthleteProfile({
      sport: 'triathlon',
      generalSportExperience: 'intermediate',
      triathlonExperience: 'some-races',
      disciplineLevels: { run: 'advanced' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
      knownMetrics: {},
      biometrics: {},
    })
    const result = analyzeLimiters(profile)
    expect(result.levels.swim).toBe('beginner')
    expect(result.levels.bike).toBe('beginner')
    expect(result.limiter).toBe('swim')
  })
})
