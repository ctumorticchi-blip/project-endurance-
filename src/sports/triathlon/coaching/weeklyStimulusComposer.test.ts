import { describe, expect, it } from 'vitest'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import { analyzeLimiters } from './limiterAnalysis'
import { getLimiterAdjustedRotation } from './weeklyStimulusComposer'

function profileWith(swim: 'beginner' | 'intermediate' | 'advanced', bike: 'beginner' | 'intermediate' | 'advanced', run: 'beginner' | 'intermediate' | 'advanced') {
  return createAthleteProfile({
    sport: 'triathlon',
    generalSportExperience: 'intermediate',
    triathlonExperience: 'some-races',
    disciplineLevels: { swim, bike, run },
    equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
    knownMetrics: {},
    biometrics: {},
  })
}

describe('getLimiterAdjustedRotation', () => {
  it('gives the limiter discipline a development-weighted rotation with no top-end intensity entry', () => {
    const analysis = analyzeLimiters(profileWith('beginner', 'intermediate', 'advanced')) // swim is the limiter
    const swimRotation = getLimiterAdjustedRotation('swim', analysis)
    expect(swimRotation).not.toContain('intervals')
    expect(swimRotation.filter((t) => t === 'technique').length).toBeGreaterThanOrEqual(2)
  })

  it('gives the strongest discipline a maintenance-only rotation with no long/top-end entries', () => {
    const analysis = analyzeLimiters(profileWith('beginner', 'intermediate', 'advanced')) // run is strongest
    const runRotation = getLimiterAdjustedRotation('run', analysis)
    expect(runRotation).not.toContain('long')
    expect(runRotation).not.toContain('intervals')
  })

  it('gives the middle (neither limiter nor strongest) discipline the untouched generic rotation', () => {
    const analysis = analyzeLimiters(profileWith('beginner', 'intermediate', 'advanced')) // bike is the middle discipline
    const bikeRotation = getLimiterAdjustedRotation('bike', analysis)
    expect(bikeRotation).toEqual(['endurance', 'long', 'vo2max', 'endurance'])
  })

  it('gives every discipline the generic rotation for a balanced athlete', () => {
    const analysis = analyzeLimiters(profileWith('intermediate', 'intermediate', 'intermediate'))
    expect(getLimiterAdjustedRotation('swim', analysis)).toEqual(['technique', 'endurance', 'intervals', 'endurance'])
    expect(getLimiterAdjustedRotation('bike', analysis)).toEqual(['endurance', 'long', 'vo2max', 'endurance'])
    expect(getLimiterAdjustedRotation('run', analysis)).toEqual(['endurance', 'long', 'intervals', 'endurance'])
  })

  it('produces meaningfully different programs for two athletes with the same race goal but opposite limiters (success criterion #1)', () => {
    const weakSwimmer = analyzeLimiters(profileWith('beginner', 'intermediate', 'advanced'))
    const weakRunner = analyzeLimiters(profileWith('advanced', 'intermediate', 'beginner'))

    expect(getLimiterAdjustedRotation('swim', weakSwimmer)).not.toEqual(getLimiterAdjustedRotation('swim', weakRunner))
    expect(getLimiterAdjustedRotation('run', weakSwimmer)).not.toEqual(getLimiterAdjustedRotation('run', weakRunner))
  })
})
