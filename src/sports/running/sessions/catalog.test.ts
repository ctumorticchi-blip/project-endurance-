import { describe, expect, it } from 'vitest'
import {
  getTemplateById,
  getTemplatesByDiscipline,
  instantiateSessionTemplate,
  SESSION_CATALOG,
} from './index'

const RUNNING_DISCIPLINES = ['run', 'strength', 'mobility'] as const

describe('SESSION_CATALOG (running)', () => {
  it('has unique template ids', () => {
    const ids = SESSION_CATALOG.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers every running discipline with at least one template', () => {
    for (const discipline of RUNNING_DISCIPLINES) {
      expect(getTemplatesByDiscipline(discipline).length).toBeGreaterThan(0)
    }
  })

  it('has no swim/bike/brick templates — running is single-discipline', () => {
    expect(getTemplatesByDiscipline('swim')).toHaveLength(0)
    expect(getTemplatesByDiscipline('bike')).toHaveLength(0)
    expect(getTemplatesByDiscipline('brick')).toHaveLength(0)
  })

  it('every template has a positive estimated duration', () => {
    for (const template of SESSION_CATALOG) {
      expect(template.estimatedDurationMin).toBeGreaterThan(0)
    }
  })

  it('every block has a coherent, in-range RPE band', () => {
    for (const template of SESSION_CATALOG) {
      for (const block of template.blocks) {
        expect(block.targetRpeMin).toBeGreaterThanOrEqual(1)
        expect(block.targetRpeMax).toBeLessThanOrEqual(10)
        expect(block.targetRpeMin).toBeLessThanOrEqual(block.targetRpeMax)
      }
    }
  })

  it('every block is either time-based or distance-based (or both), never neither', () => {
    for (const template of SESSION_CATALOG) {
      for (const block of template.blocks) {
        expect(block.durationSec !== undefined || block.distanceMeters !== undefined).toBe(true)
      }
    }
  })

  it('has a key long-run anchor and at least one key session per intensity phase', () => {
    const keyRunSessions = SESSION_CATALOG.filter((t) => t.discipline === 'run' && t.defaultPriority === 'key')
    expect(keyRunSessions.some((t) => t.sessionType === 'long')).toBe(true)
    expect(keyRunSessions.some((t) => t.sessionType === 'threshold')).toBe(true)
    expect(keyRunSessions.some((t) => t.sessionType === 'race-specific')).toBe(true)
  })

  it('has at least two standard-tier structural variants for long/tempo/threshold/intervals — real rotation, not repetition', () => {
    for (const type of ['long', 'tempo', 'threshold', 'intervals'] as const) {
      const standardVariants = SESSION_CATALOG.filter((t) => t.sessionType === type && t.tier === 'standard')
      expect(standardVariants.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('has a full tier ladder (minimal/reduced/standard/peak) for the long run and tempo, the sessions used across every phase', () => {
    for (const type of ['long', 'tempo'] as const) {
      const tiers = new Set(SESSION_CATALOG.filter((t) => t.sessionType === type).map((t) => t.tier))
      expect(tiers.has('minimal')).toBe(true)
      expect(tiers.has('reduced')).toBe(true)
      expect(tiers.has('standard')).toBe(true)
      expect(tiers.has('peak')).toBe(true)
    }
  })
})

describe('getTemplateById (running)', () => {
  it('finds a known template', () => {
    expect(getTemplateById('running-long-standard')?.title).toBe('Sortie longue')
  })

  it('returns undefined for an unknown id', () => {
    expect(getTemplateById('does-not-exist')).toBeUndefined()
  })
})

describe('instantiateSessionTemplate (running)', () => {
  it('produces a PlannedSession with fresh ids on every call', () => {
    const template = getTemplateById('running-long-standard')!
    const a = instantiateSessionTemplate(template, { date: '2026-06-01', weekId: 'week-1' })
    const b = instantiateSessionTemplate(template, { date: '2026-06-08', weekId: 'week-2' })

    expect(a.id).not.toBe(b.id)
    expect(a.blocks[0]?.id).not.toBe(b.blocks[0]?.id)
    expect(a.blocks).toHaveLength(template.blocks.length)
    expect(a.priority).toBe(template.defaultPriority)
  })
})
