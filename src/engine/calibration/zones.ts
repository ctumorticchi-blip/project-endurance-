/**
 * Zone models. These are coarse, well-known heuristics (documented here,
 * not hidden) — never presented as medically precise. See docs/metrics.md
 * "no false precision". Every zone table is a fixed, named, decomposable
 * set of thresholds so the UI can always show *why* a target falls in a
 * given zone.
 */

export type ZoneName = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'

export const ZONE_NAMES: readonly ZoneName[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']

export interface Zone {
  name: ZoneName
  label: string
  /** Inclusive lower bound. */
  min: number
  /** Inclusive upper bound. `Infinity` for the top zone. */
  max: number
}

function assertAscending(zones: Zone[]): Zone[] {
  for (let i = 1; i < zones.length; i++) {
    const prev = zones[i - 1]
    const curr = zones[i]
    if (!prev || !curr || prev.min >= curr.min || prev.max > curr.min) {
      throw new Error(`Zone table is not strictly ascending at index ${i}`)
    }
  }
  return zones
}

/**
 * Heart-rate zones as a percentage of Lnet Threshold Heart Rate (LTHR) —
 * a standard 5-zone breakdown (comparable to Friel's run zones collapsed
 * from 7 to 5 for M0's simpler UI).
 */
export function heartRateZonesFromThreshold(thresholdBpm: number): Zone[] {
  const bounds: [ZoneName, string, number, number][] = [
    ['Z1', 'Récupération', 0, 0.81],
    ['Z2', 'Endurance', 0.81, 0.89],
    ['Z3', 'Tempo', 0.9, 0.93],
    ['Z4', 'Seuil', 0.94, 0.99],
    ['Z5', 'VO2max+', 1.0, Infinity],
  ] as never
  return assertAscending(
    bounds.map(([name, label, minPct, maxPct]) => ({
      name,
      label,
      min: Math.round(minPct * thresholdBpm),
      max: maxPct === Infinity ? Infinity : Math.round(maxPct * thresholdBpm),
    })),
  )
}

/** Fallback when only max HR is known (less precise than threshold-based). */
export function heartRateZonesFromMax(maxBpm: number): Zone[] {
  const bounds: [ZoneName, string, number, number][] = [
    ['Z1', 'Récupération', 0.5, 0.6],
    ['Z2', 'Endurance', 0.6, 0.7],
    ['Z3', 'Tempo', 0.7, 0.8],
    ['Z4', 'Seuil', 0.8, 0.9],
    ['Z5', 'VO2max+', 0.9, Infinity],
  ]
  return assertAscending(
    bounds.map(([name, label, minPct, maxPct]) => ({
      name,
      label,
      min: Math.round(minPct * maxBpm),
      max: maxPct === Infinity ? Infinity : Math.round(maxPct * maxBpm),
    })),
  )
}

/** Power zones as % of FTP (Coggan-style, collapsed to 5 zones for M0). */
export function powerZonesFromFtp(ftpWatts: number): Zone[] {
  const bounds: [ZoneName, string, number, number][] = [
    ['Z1', 'Récupération', 0, 0.55],
    ['Z2', 'Endurance', 0.55, 0.75],
    ['Z3', 'Tempo', 0.76, 0.9],
    ['Z4', 'Seuil', 0.91, 1.05],
    ['Z5', 'VO2max+', 1.06, Infinity],
  ]
  return assertAscending(
    bounds.map(([name, label, minPct, maxPct]) => ({
      name,
      label,
      min: Math.round(minPct * ftpWatts),
      max: maxPct === Infinity ? Infinity : Math.round(maxPct * ftpWatts),
    })),
  )
}

/**
 * Pace zones expressed in seconds per unit (per km for running, per 100m
 * for swimming). Slower pace = higher seconds value, so the "min" bound is
 * the *fastest* (smallest seconds) edge of the zone and "max" the slowest.
 */
export function paceZonesFromThreshold(thresholdSecPerUnit: number): Zone[] {
  const bounds: [ZoneName, string, number, number][] = [
    ['Z5', 'VO2max+', 0.88, 0.97],
    ['Z4', 'Seuil', 0.98, 1.02],
    ['Z3', 'Tempo', 1.03, 1.09],
    ['Z2', 'Endurance', 1.1, 1.2],
    ['Z1', 'Récupération', 1.21, 1.4],
  ]
  const zones = bounds.map(([name, label, minPct, maxPct]) => ({
    name,
    label,
    min: Math.round(minPct * thresholdSecPerUnit),
    max: Math.round(maxPct * thresholdSecPerUnit),
  }))
  // Sort ascending by seconds (fastest zone first) to satisfy the shared invariant.
  return assertAscending([...zones].sort((a, b) => a.min - b.min))
}
