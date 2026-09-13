import { describe, expect, it } from 'vitest'
import {
  heartRateZonesFromMax,
  heartRateZonesFromThreshold,
  paceZonesFromThreshold,
  powerZonesFromFtp,
  ZONE_NAMES,
} from './zones'

describe('heartRateZonesFromThreshold', () => {
  it('produces 5 ascending, non-overlapping zones covering the full range', () => {
    const zones = heartRateZonesFromThreshold(170)
    expect(zones).toHaveLength(5)
    expect(zones.map((z) => z.name)).toEqual(ZONE_NAMES)
    expect(zones[0]?.min).toBe(0)
    expect(zones[4]?.max).toBe(Infinity)
    for (let i = 1; i < zones.length; i++) {
      expect(zones[i]!.min).toBeGreaterThanOrEqual(zones[i - 1]!.max === Infinity ? 0 : zones[i - 1]!.max)
    }
  })
})

describe('heartRateZonesFromMax', () => {
  it('produces 5 ascending zones scaled from max HR', () => {
    const zones = heartRateZonesFromMax(190)
    expect(zones).toHaveLength(5)
    expect(zones[0]?.min).toBe(95) // 50% of 190
  })
})

describe('powerZonesFromFtp', () => {
  it('places threshold (Z4) around FTP itself', () => {
    const zones = powerZonesFromFtp(200)
    const z4 = zones.find((z) => z.name === 'Z4')
    expect(z4?.min).toBeLessThanOrEqual(200)
    expect(z4?.max).toBeGreaterThanOrEqual(200)
  })
})

describe('paceZonesFromThreshold', () => {
  it('orders zones from fastest (Z5) to slowest (Z1) by seconds', () => {
    const zones = paceZonesFromThreshold(240) // 4:00/km threshold
    const order = zones.map((z) => z.name)
    expect(order).toEqual(['Z5', 'Z4', 'Z3', 'Z2', 'Z1'])
    for (let i = 1; i < zones.length; i++) {
      expect(zones[i]!.min).toBeGreaterThanOrEqual(zones[i - 1]!.max)
    }
  })
})
