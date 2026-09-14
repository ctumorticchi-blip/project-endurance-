import { describe, expect, it } from 'vitest'
import { pickBestFittingTemplate } from './pickTemplate'

describe('pickBestFittingTemplate', () => {
  it('defaults to the standard tier when none is given', () => {
    const template = pickBestFittingTemplate('bike', 'threshold', 90)
    expect(template?.id).toBe('bike-threshold')
  })

  it('picks a lighter, shorter variant on a reduced tier', () => {
    const standard = pickBestFittingTemplate('bike', 'threshold', 90, { tier: 'standard' })
    const reduced = pickBestFittingTemplate('bike', 'threshold', 90, { tier: 'reduced' })
    expect(reduced?.tier).toBe('reduced')
    expect(reduced!.estimatedDurationMin).toBeLessThan(standard!.estimatedDurationMin)
  })

  it('picks a harder, longer variant on a peak tier', () => {
    const standard = pickBestFittingTemplate('bike', 'threshold', 90, { tier: 'standard' })
    const peak = pickBestFittingTemplate('bike', 'threshold', 90, { tier: 'peak' })
    expect(peak?.tier).toBe('peak')
    expect(peak!.estimatedDurationMin).toBeGreaterThan(standard!.estimatedDurationMin)
  })

  it('falls back to the standard tier when the requested tier has no variant that fits', () => {
    // bike-threshold-peak needs more time than this — but the standard
    // tier's shortest variant still fits, so it's used instead of bailing.
    const template = pickBestFittingTemplate('bike', 'threshold', 65, { tier: 'peak' })
    expect(template).toBeDefined()
    expect(template!.estimatedDurationMin).toBeLessThanOrEqual(65)
  })

  it('alternates between structural variants of the same (type, tier) using rotationKey', () => {
    const a = pickBestFittingTemplate('bike', 'threshold', 90, { tier: 'standard', rotationKey: 0 })
    const b = pickBestFittingTemplate('bike', 'threshold', 90, { tier: 'standard', rotationKey: 1 })
    expect(a?.id).not.toBe(b?.id)
    // Same rotation key always yields the same variant — deterministic, not random.
    const aAgain = pickBestFittingTemplate('bike', 'threshold', 90, { tier: 'standard', rotationKey: 0 })
    expect(a?.id).toBe(aAgain?.id)
  })

  it('degrades to an easier type (never a same-length harder one) when the preferred type does not fit at all', () => {
    // 32 min rules out every threshold/endurance variant (all >= 40 min)
    // but fits the recovery spin — proves it falls through to an easier
    // type rather than returning nothing.
    const template = pickBestFittingTemplate('bike', 'threshold', 32)
    expect(template).toBeDefined()
    expect(['recovery', 'endurance']).toContain(template!.sessionType)
  })

  it('returns undefined when nothing of the discipline fits the time available', () => {
    expect(pickBestFittingTemplate('bike', 'threshold', 1)).toBeUndefined()
  })
})
