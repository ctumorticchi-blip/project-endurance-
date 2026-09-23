import { describe, expect, it } from 'vitest'
import { explainReasonCode } from './reasonCodeLabels'

describe('explainReasonCode', () => {
  it('returns undefined when no reason codes are recorded', () => {
    expect(explainReasonCode(undefined)).toBeUndefined()
    expect(explainReasonCode([])).toBeUndefined()
  })

  it('returns undefined for an unrecognised code rather than leaking it raw to the athlete (brief §34)', () => {
    expect(explainReasonCode(['NOT_A_REAL_CODE'])).toBeUndefined()
  })

  it('only ever reads the first reason code', () => {
    expect(explainReasonCode(['ANCHOR_SESSION', 'NEUTRAL_TOUCH'])).toBe(explainReasonCode(['ANCHOR_SESSION']))
  })

  // Contract test (brief §58): POOL_UNAVAILABLE_REALLOCATED must never be
  // explained as a fatigue-driven change — it is a resource constraint
  // (no pool access this week), not a response to the athlete's fatigue.
  it('never attributes POOL_UNAVAILABLE_REALLOCATED to fatigue', () => {
    const text = explainReasonCode(['POOL_UNAVAILABLE_REALLOCATED'])
    expect(text).toBeDefined()
    expect(text!.toLowerCase()).not.toContain('fatigue')
  })

  it('explains every reason code the composer actually emits', () => {
    const composerCodes = [
      'ANCHOR_SESSION',
      'POOL_UNAVAILABLE_REALLOCATED',
      'MINIMAL_COVERAGE',
      'LIMITER_DEVELOPMENT_TOUCH',
      'STRONGEST_MAINTENANCE_TOUCH',
      'NEUTRAL_TOUCH',
      'BRICK_PROGRESSION',
      'RECOVERY_BUDGET_AVAILABLE',
    ]
    for (const code of composerCodes) {
      expect(explainReasonCode([code]), `missing translation for ${code}`).toBeDefined()
    }
  })
})
