import { describe, expect, it } from 'vitest'
import { DISCIPLINES } from '@/shared/types/common'
import {
  getTemplateById,
  getTemplatesByDiscipline,
  instantiateSessionTemplate,
  SESSION_CATALOG,
} from './index'

describe('SESSION_CATALOG', () => {
  it('has unique template ids', () => {
    const ids = SESSION_CATALOG.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers every discipline with at least one template', () => {
    for (const discipline of DISCIPLINES) {
      expect(getTemplatesByDiscipline(discipline).length).toBeGreaterThan(0)
    }
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

  it('key sessions exist for the disciplines that need an anchor session', () => {
    const keySessions = SESSION_CATALOG.filter((t) => t.defaultPriority === 'key')
    expect(keySessions.some((t) => t.discipline === 'bike')).toBe(true)
    expect(keySessions.some((t) => t.discipline === 'run')).toBe(true)
    expect(keySessions.some((t) => t.discipline === 'swim')).toBe(true)
    expect(keySessions.some((t) => t.discipline === 'brick')).toBe(true)
  })
})

describe('getTemplateById', () => {
  it('finds a known template', () => {
    expect(getTemplateById('bike-sweet-spot')?.title).toBe('Sweet Spot vélo')
  })

  it('returns undefined for an unknown id', () => {
    expect(getTemplateById('does-not-exist')).toBeUndefined()
  })
})

describe('instantiateSessionTemplate', () => {
  it('produces a PlannedSession with fresh ids on every call', () => {
    const template = getTemplateById('bike-sweet-spot')!
    const a = instantiateSessionTemplate(template, { date: '2026-06-01', weekId: 'week-1' })
    const b = instantiateSessionTemplate(template, { date: '2026-06-08', weekId: 'week-2' })

    expect(a.id).not.toBe(b.id)
    expect(a.blocks[0]?.id).not.toBe(b.blocks[0]?.id)
    expect(a.blocks).toHaveLength(template.blocks.length)
    expect(a.priority).toBe(template.defaultPriority)
  })

  it('allows overriding the default priority', () => {
    const template = getTemplateById('mobility-general')!
    const instance = instantiateSessionTemplate(template, {
      date: '2026-06-01',
      weekId: 'week-1',
      priority: 'key',
    })
    expect(instance.priority).toBe('key')
  })
})
