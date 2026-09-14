import { describe, expect, it } from 'vitest'
import {
  disciplineForRole,
  getQuality2Type,
  priorityForRole,
  QUALITY_TYPE_BY_PHASE,
  WEEKLY_SLOT_ROLES,
} from './weeklySlots'

describe('WEEKLY_SLOT_ROLES', () => {
  it('always leads with the long run when at least one day is available', () => {
    for (let days = 1; days <= 7; days++) {
      expect(WEEKLY_SLOT_ROLES[days]?.[0]).toBe('long')
    }
  })

  it('never has more roles than days requested', () => {
    for (let days = 0; days <= 7; days++) {
      expect(WEEKLY_SLOT_ROLES[days]?.length).toBeLessThanOrEqual(days)
    }
  })

  it('only introduces strength/mobility once every running day is covered', () => {
    for (let days = 0; days <= 5; days++) {
      expect(WEEKLY_SLOT_ROLES[days]).not.toContain('strength')
      expect(WEEKLY_SLOT_ROLES[days]).not.toContain('mobility')
    }
    expect(WEEKLY_SLOT_ROLES[6]).toContain('strength')
    expect(WEEKLY_SLOT_ROLES[7]).toContain('mobility')
  })
})

describe('disciplineForRole / priorityForRole', () => {
  it('maps long/quality/quality2/easy to the run discipline', () => {
    for (const role of ['long', 'quality', 'quality2', 'easy'] as const) {
      expect(disciplineForRole(role)).toBe('run')
    }
  })

  it('gives the long run and main quality session key priority', () => {
    expect(priorityForRole('long')).toBe('key')
    expect(priorityForRole('quality')).toBe('key')
  })

  it('gives strength/mobility optional priority', () => {
    expect(priorityForRole('strength')).toBe('optional')
    expect(priorityForRole('mobility')).toBe('optional')
  })
})

describe('QUALITY_TYPE_BY_PHASE', () => {
  it('has no structured hard work in the base phase (aerobic-base-first)', () => {
    expect(QUALITY_TYPE_BY_PHASE.base).toBe('endurance')
  })

  it('progresses to threshold in build and VO2max/intervals in specific', () => {
    expect(QUALITY_TYPE_BY_PHASE.build).toBe('threshold')
    expect(QUALITY_TYPE_BY_PHASE.specific).toBe('intervals')
  })
})

describe('getQuality2Type', () => {
  it('never rotates on a deload (reduced/minimal) week — always the calm default', () => {
    const rotated = new Set(
      Array.from({ length: 8 }, (_, i) => getQuality2Type('build', i, 'reduced')),
    )
    expect(rotated.size).toBe(1)
  })

  it('rotates across weeks in build/specific on a standard-or-harder week', () => {
    const values = Array.from({ length: 4 }, (_, i) => getQuality2Type('specific', i, 'standard'))
    expect(new Set(values).size).toBeGreaterThan(1)
  })

  it('never rotates in base/taper/race — always the calm default', () => {
    for (const phase of ['base', 'taper', 'race'] as const) {
      const values = new Set(Array.from({ length: 4 }, (_, i) => getQuality2Type(phase, i, 'standard')))
      expect(values.size).toBe(1)
    }
  })
})
