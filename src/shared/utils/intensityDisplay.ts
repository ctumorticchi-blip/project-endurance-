import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import type { AthleteZones } from '@/engine/calibration/calculateAthleteZones'
import { resolveIntensityPrescription } from '@/engine/intensity/resolveIntensityPrescription'
import type { Discipline } from '@/shared/types/common'

/**
 * The best available *tested-metric* intensity target text for one block
 * (Coaching Experience V1 brief §7): real power/pace/HR, using
 * `resolveIntensityPrescription` (`engine/intensity/`) — already fully
 * built and already forbidding fabricated numbers, just not called from
 * any screen before this milestone. Returns `undefined` both when the
 * block has no relative zone at all (RPE-only families: strength,
 * mobility, transition) *and* when nothing tested resolved (the
 * prescription's own RPE-only fallback) — callers already show the RPE
 * range unconditionally, so this only ever adds to it, never duplicates it.
 */
export function resolveBlockTargetDescription(
  discipline: Discipline,
  block: WorkoutBlock,
  zones: AthleteZones,
): string | undefined {
  if (!block.targetZone) return undefined
  const prescription = resolveIntensityPrescription({ discipline, block, zones })
  return prescription.usesTestedMetric ? prescription.targetDescription : undefined
}
