import { describe, expect, it } from 'vitest'
import { allocatePhases } from './phaseAllocation'

describe('allocatePhases', () => {
  it('collapses everything but the last week to taper when the runway is very short', () => {
    expect(allocatePhases(1, 'sprint')).toEqual(['race'])
    expect(allocatePhases(2, 'sprint')).toEqual(['taper', 'race'])
    expect(allocatePhases(3, 'olympic')).toEqual(['taper', 'taper', 'race'])
  })

  it('always ends on a single race week', () => {
    for (const weeks of [1, 2, 3, 6, 12, 24, 30]) {
      const phases = allocatePhases(weeks, 'sprint')
      expect(phases.at(-1)).toBe('race')
      expect(phases.filter((p) => p === 'race')).toHaveLength(1)
      expect(phases).toHaveLength(weeks)
    }
  })

  it('gives Olympic distance a 2-week taper and Sprint a 1-week taper when there is room', () => {
    const olympic = allocatePhases(20, 'olympic')
    const sprint = allocatePhases(20, 'sprint')
    expect(olympic.filter((p) => p === 'taper')).toHaveLength(2)
    expect(sprint.filter((p) => p === 'taper')).toHaveLength(1)
  })

  it('gives every phase at least one week once there is enough runway', () => {
    const phases = allocatePhases(12, 'sprint')
    expect(phases.filter((p) => p === 'base').length).toBeGreaterThanOrEqual(1)
    expect(phases.filter((p) => p === 'build').length).toBeGreaterThanOrEqual(1)
    expect(phases.filter((p) => p === 'specific').length).toBeGreaterThanOrEqual(1)
  })

  it('phases always appear in race-backwards order', () => {
    const phases = allocatePhases(24, 'olympic')
    const order = ['base', 'build', 'specific', 'taper', 'race']
    let lastIndex = -1
    for (const phase of phases) {
      const index = order.indexOf(phase)
      expect(index).toBeGreaterThanOrEqual(lastIndex)
      lastIndex = index
    }
  })
})
