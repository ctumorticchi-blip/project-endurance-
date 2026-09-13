import type { ZoneName } from '@/engine/calibration/zones'

/**
 * One structured chunk of a session (warm-up, a set of repeats, cool-down).
 * A block is time- or distance-based (never both), and its target is
 * always relative (a zone name + an RPE range) so it degrades gracefully
 * to "no absolute numbers" when the athlete has no calibrated zones yet —
 * see engine/calibration/calculateAthleteZones.
 */
export interface WorkoutBlock {
  id: string
  label: string
  durationSec?: number
  distanceMeters?: number
  /** How many times this block repeats back-to-back (e.g. 3x8min). Omit or 1 for a single pass. */
  repeat?: number
  targetZone?: ZoneName
  /** Inclusive RPE range, 1-10. Always present as a fallback even when a zone target exists. */
  targetRpeMin: number
  targetRpeMax: number
  /** Rest after each repeat, seconds. Omit for continuous blocks. */
  restSec?: number
  note?: string
}

export function totalBlockDurationSec(block: WorkoutBlock): number | undefined {
  if (block.durationSec === undefined) return undefined
  const repeats = block.repeat ?? 1
  const restTotal = (block.restSec ?? 0) * Math.max(0, repeats - 1)
  return block.durationSec * repeats + restTotal
}
