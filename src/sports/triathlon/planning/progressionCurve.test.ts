import { describe, expect, it } from 'vitest'
import { getSessionTier, getWeekLoadMultiplier } from './progressionCurve'

describe('getWeekLoadMultiplier', () => {
  it('cycles a progressive-then-deload pattern within base/build/specific', () => {
    for (const phase of ['base', 'build', 'specific'] as const) {
      const week0 = getWeekLoadMultiplier(phase, 0, 8)
      const week2 = getWeekLoadMultiplier(phase, 2, 8)
      const week3 = getWeekLoadMultiplier(phase, 3, 8)
      // Week 3 (the deload) is lighter than the peak week just before it.
      expect(week3).toBeLessThan(week2)
      // The cycle repeats: week 4 (start of the next block) resets like week 0.
      expect(getWeekLoadMultiplier(phase, 4, 8)).toBe(week0)
    }
  })

  it('descends monotonically across a multi-week taper, ending lightest', () => {
    const first = getWeekLoadMultiplier('taper', 0, 2)
    const last = getWeekLoadMultiplier('taper', 1, 2)
    expect(last).toBeLessThan(first)
  })

  it('gives a single-week taper a light load', () => {
    expect(getWeekLoadMultiplier('taper', 0, 1)).toBeLessThan(0.6)
  })

  it('keeps the race week very light', () => {
    expect(getWeekLoadMultiplier('race', 0, 1)).toBeLessThan(0.5)
  })
})

describe('getSessionTier', () => {
  it('buckets a low multiplier as minimal, mid as reduced/standard, high as peak', () => {
    expect(getSessionTier(0.4)).toBe('minimal')
    expect(getSessionTier(0.7)).toBe('reduced')
    expect(getSessionTier(0.95)).toBe('standard')
    expect(getSessionTier(1.2)).toBe('peak')
  })
})
