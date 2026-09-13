import type { KnownMetrics } from '@/core/athlete/AthleteProfile'
import {
  heartRateZonesFromMax,
  heartRateZonesFromThreshold,
  paceZonesFromThreshold,
  powerZonesFromFtp,
  type Zone,
} from './zones'

export interface AthleteZones {
  heartRate?: Zone[]
  /** Bike power zones — only present when FTP is known. */
  power?: Zone[]
  /** Seconds/km. */
  runPace?: Zone[]
  /** Seconds/100m. */
  swimPace?: Zone[]
}

/**
 * Only computes a zone table when the athlete has actually provided the
 * metric it depends on — never fabricates a number from nothing (brief
 * §34, no false science). Missing zones mean the session prescription
 * falls back to RPE + relative-zone labels instead of absolute targets.
 */
export function calculateAthleteZones(metrics: KnownMetrics): AthleteZones {
  const zones: AthleteZones = {}

  if (metrics.thresholdHeartRate) {
    zones.heartRate = heartRateZonesFromThreshold(metrics.thresholdHeartRate)
  } else if (metrics.maxHeartRate) {
    zones.heartRate = heartRateZonesFromMax(metrics.maxHeartRate)
  }

  if (metrics.ftpWatts) {
    zones.power = powerZonesFromFtp(metrics.ftpWatts)
  }

  if (metrics.thresholdPaceSecPerKm) {
    zones.runPace = paceZonesFromThreshold(metrics.thresholdPaceSecPerKm)
  }

  if (metrics.cssSecPer100m) {
    zones.swimPace = paceZonesFromThreshold(metrics.cssSecPer100m)
  }

  return zones
}
