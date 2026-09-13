import { describe, expect, it } from 'vitest'
import { calculateAthleteZones } from './calculateAthleteZones'

describe('calculateAthleteZones', () => {
  it('returns no zones at all when nothing is known', () => {
    expect(calculateAthleteZones({})).toEqual({})
  })

  it('prefers threshold HR over max HR when both are known', () => {
    const zones = calculateAthleteZones({ thresholdHeartRate: 165, maxHeartRate: 190 })
    // Threshold-based Z1 top is 0.81*165 ≈ 134, max-based would give 0.6*190=114.
    expect(zones.heartRate?.[0]?.max).toBe(134)
  })

  it('falls back to max HR when threshold HR is unknown', () => {
    const zones = calculateAthleteZones({ maxHeartRate: 190 })
    expect(zones.heartRate?.[0]?.min).toBe(95)
  })

  it('only computes power zones when FTP is known', () => {
    expect(calculateAthleteZones({ thresholdHeartRate: 165 }).power).toBeUndefined()
    expect(calculateAthleteZones({ ftpWatts: 220 }).power).toBeDefined()
  })

  it('only computes pace zones for the disciplines with known thresholds', () => {
    const zones = calculateAthleteZones({ cssSecPer100m: 95 })
    expect(zones.swimPace).toBeDefined()
    expect(zones.runPace).toBeUndefined()
  })
})
