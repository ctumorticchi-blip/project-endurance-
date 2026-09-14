import { describe, expect, it } from 'vitest'
import { allocatePhases } from './phaseAllocation'

describe('allocatePhases (running)', () => {
  it('collapses everything but the last week to taper when the runway is very short', () => {
    expect(allocatePhases(1, '5k')).toEqual(['race'])
    expect(allocatePhases(2, '5k')).toEqual(['taper', 'race'])
    expect(allocatePhases(3, 'marathon')).toEqual(['taper', 'taper', 'race'])
  })

  it('always ends on a single race week', () => {
    for (const weeks of [1, 2, 3, 6, 12, 24, 30]) {
      const phases = allocatePhases(weeks, '10k')
      expect(phases.at(-1)).toBe('race')
      expect(phases.filter((p) => p === 'race')).toHaveLength(1)
      expect(phases).toHaveLength(weeks)
    }
  })

  it('gives the marathon a 2-week taper and the 5K/10K a 1-week taper when there is room', () => {
    const marathon = allocatePhases(20, 'marathon')
    const half = allocatePhases(20, 'half-marathon')
    const tenK = allocatePhases(20, '10k')
    const fiveK = allocatePhases(20, '5k')
    expect(marathon.filter((p) => p === 'taper')).toHaveLength(2)
    expect(half.filter((p) => p === 'taper')).toHaveLength(2)
    expect(tenK.filter((p) => p === 'taper')).toHaveLength(1)
    expect(fiveK.filter((p) => p === 'taper')).toHaveLength(1)
  })

  it('gives every phase at least one week once there is enough runway', () => {
    const phases = allocatePhases(12, '10k')
    expect(phases.filter((p) => p === 'base').length).toBeGreaterThanOrEqual(1)
    expect(phases.filter((p) => p === 'build').length).toBeGreaterThanOrEqual(1)
    expect(phases.filter((p) => p === 'specific').length).toBeGreaterThanOrEqual(1)
  })

  it('phases always appear in race-backwards order', () => {
    const phases = allocatePhases(24, 'marathon')
    const order = ['base', 'build', 'specific', 'taper', 'race']
    let lastIndex = -1
    for (const phase of phases) {
      const index = order.indexOf(phase)
      expect(index).toBeGreaterThanOrEqual(lastIndex)
      lastIndex = index
    }
  })

  it('gives a 5K proportionally more specific-phase weeks than a marathon over a long runway', () => {
    const totalWeeks = 30
    const fiveK = allocatePhases(totalWeeks, '5k')
    const marathon = allocatePhases(totalWeeks, 'marathon')

    const specificShare = (phases: ReturnType<typeof allocatePhases>) =>
      phases.filter((p) => p === 'specific').length / phases.length

    expect(specificShare(fiveK)).toBeGreaterThan(specificShare(marathon))
  })

  it('gives a marathon proportionally more base-phase weeks than a 5K over a long runway', () => {
    const totalWeeks = 30
    const fiveK = allocatePhases(totalWeeks, '5k')
    const marathon = allocatePhases(totalWeeks, 'marathon')

    const baseShare = (phases: ReturnType<typeof allocatePhases>) =>
      phases.filter((p) => p === 'base').length / phases.length

    expect(baseShare(marathon)).toBeGreaterThan(baseShare(fiveK))
  })
})
