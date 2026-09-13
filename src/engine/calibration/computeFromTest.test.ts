import { describe, expect, it } from 'vitest'
import { computeCssSecPer100m } from './computeCssFromTest'
import { computeFtpFromTwentyMinuteTest } from './computeFtpFromTest'
import { computeThresholdPaceSecPerKm } from './computeThresholdPaceFromTest'

describe('computeFtpFromTwentyMinuteTest', () => {
  it('takes 95% of the average power', () => {
    expect(computeFtpFromTwentyMinuteTest(250)).toBe(238)
  })
})

describe('computeCssSecPer100m', () => {
  it('derives pace per 100m from the delta between two time trials', () => {
    // 400m in 400s, 200m in 180s → extra 200m took 220s → 110s/100m.
    expect(computeCssSecPer100m(400, 400, 200, 180)).toBe(110)
  })

  it('rejects an inconsistent pair of trials', () => {
    expect(() => computeCssSecPer100m(200, 180, 400, 400)).toThrow()
  })
})

describe('computeThresholdPaceSecPerKm', () => {
  it('converts a 20-minute test distance into a per-km pace', () => {
    // 5000m in 1200s (20 min) → 240 sec/km.
    expect(computeThresholdPaceSecPerKm(5000, 1200)).toBe(240)
  })
})
