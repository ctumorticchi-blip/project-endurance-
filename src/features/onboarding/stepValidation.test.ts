import { describe, expect, it } from 'vitest'
import { createInitialDraft, type OnboardingDraft } from './onboardingState'
import { isStepValid } from './stepValidation'

function draftWith(patch: Partial<OnboardingDraft>): OnboardingDraft {
  return { ...createInitialDraft(), ...patch }
}

describe('isStepValid — experience step', () => {
  it('requires triathlonExperience + all three discipline levels for a triathlon draft', () => {
    const incomplete = draftWith({ sport: 'triathlon', generalSportExperience: 'beginner' })
    expect(isStepValid('experience', incomplete)).toBe(false)

    const complete = draftWith({
      sport: 'triathlon',
      generalSportExperience: 'beginner',
      triathlonExperience: 'first-triathlon',
      swimLevel: 'beginner',
      bikeLevel: 'beginner',
      runLevel: 'beginner',
    })
    expect(isStepValid('experience', complete)).toBe(true)
  })

  it('requires only runningExperience + run level for a running draft — swim/bike are never asked', () => {
    const incomplete = draftWith({ sport: 'running', generalSportExperience: 'beginner' })
    expect(isStepValid('experience', incomplete)).toBe(false)

    const complete = draftWith({
      sport: 'running',
      generalSportExperience: 'beginner',
      runningExperience: 'first-time-at-distance',
      runLevel: 'beginner',
    })
    expect(isStepValid('experience', complete)).toBe(true)
  })
})

describe('isStepValid — race-goal step', () => {
  it('is valid once distance and raceDate are set, regardless of sport', () => {
    expect(isStepValid('race-goal', draftWith({ sport: 'running', distance: '10k', raceDate: '2026-06-01' }))).toBe(
      true,
    )
    expect(isStepValid('race-goal', draftWith({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-06-01' }))).toBe(
      true,
    )
    expect(isStepValid('race-goal', draftWith({ sport: 'running' }))).toBe(false)
  })
})
