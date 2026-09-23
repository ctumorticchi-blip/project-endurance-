import type { AthleteZones } from '@/engine/calibration/calculateAthleteZones'
import type { Zone } from '@/engine/calibration/zones'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import type { Discipline } from '@/shared/types/common'
import { formatPaceMinSec } from '@/shared/utils/pace'

export type MeasurementMethod = 'power' | 'pace' | 'heartRate' | 'rpe'

export interface IntensityPrescription {
  measurementMethod: MeasurementMethod
  /** Athlete-facing target, e.g. "220–240 W", "4:30–4:45 /km", "142–155 bpm", or "RPE 7-8" alone. */
  targetDescription: string
  /** Always present — RPE is the universal cross-check even when a precise metric drives the session. */
  rpeRange: [number, number]
  usesTestedMetric: boolean
  explanation: string
}

/**
 * Separates *training intent* (the block's relative `targetZone`, Z1-Z5 —
 * already sport-agnostic) from *measurement method* (brief §15): the most
 * reliable metric the athlete has actually declared, in a per-discipline
 * priority order, falling back to RPE alone when nothing more precise is
 * known. An athlete with only a phone still gets a coherent prescription;
 * one with GPS+HR+power gets more precision — never the other way around,
 * and never a fabricated number when the underlying test hasn't been done
 * (same rule `calculateAthleteZones.ts` already enforces).
 *
 * Priority order per discipline — PRODUCT_RULE, chosen for reliability in
 * real training conditions, not a claim that e.g. power is "more
 * physiologically valid" than pace:
 * - bike: power → heart rate → RPE (power is the least noisy bike signal;
 *   heart rate lags effort and drifts with heat/fatigue).
 * - run: pace → heart rate → RPE (pace is directly actionable outdoors;
 *   HR is a reasonable second choice, unlike swimming).
 * - swim: pace → RPE (heart rate monitoring is impractical/unreliable in
 *   the pool for almost every athlete — COACHING_HEURISTIC, not modeled
 *   as a fallback tier here at all).
 * - strength/mobility/brick/transition: RPE only — no zone system applies.
 */
export function resolveIntensityPrescription(input: {
  discipline: Discipline
  block: WorkoutBlock
  zones: AthleteZones
}): IntensityPrescription {
  const { discipline, block, zones } = input
  const rpeRange: [number, number] = [block.targetRpeMin, block.targetRpeMax]
  const zoneName = block.targetZone

  const tryZone = (
    table: Zone[] | undefined,
    method: MeasurementMethod,
    format: (zone: Zone) => string,
    explanation: string,
  ): IntensityPrescription | undefined => {
    if (!zoneName || !table) return undefined
    const zone = table.find((z) => z.name === zoneName)
    if (!zone) return undefined
    return { measurementMethod: method, targetDescription: format(zone), rpeRange, usesTestedMetric: true, explanation }
  }

  const formatPower = (zone: Zone) => (zone.max === Infinity ? `${Math.round(zone.min)} W+` : `${Math.round(zone.min)}–${Math.round(zone.max)} W`)
  const formatHeartRate = (zone: Zone) => (zone.max === Infinity ? `${Math.round(zone.min)} bpm+` : `${Math.round(zone.min)}–${Math.round(zone.max)} bpm`)
  const formatRunPace = (zone: Zone) =>
    zone.max === Infinity
      ? `plus rapide que ${formatPaceMinSec(zone.min, '/km')}`
      : `${formatPaceMinSec(zone.min, '')}–${formatPaceMinSec(zone.max, '/km')}`
  const formatSwimPace = (zone: Zone) =>
    zone.max === Infinity
      ? `plus rapide que ${formatPaceMinSec(zone.min, '/100m')}`
      : `${formatPaceMinSec(zone.min, '')}–${formatPaceMinSec(zone.max, '/100m')}`

  let resolved: IntensityPrescription | undefined

  if (discipline === 'bike') {
    resolved =
      tryZone(zones.power, 'power', formatPower, 'Ta puissance seuil (FTP) testée pilote cette cible.') ??
      tryZone(zones.heartRate, 'heartRate', formatHeartRate, 'Ta fréquence cardiaque seuil pilote cette cible, en l’absence de FTP connue.')
  } else if (discipline === 'run') {
    resolved =
      tryZone(zones.runPace, 'pace', formatRunPace, 'Ton allure seuil testée pilote cette cible.') ??
      tryZone(zones.heartRate, 'heartRate', formatHeartRate, 'Ta fréquence cardiaque seuil pilote cette cible, en l’absence d’allure seuil connue.')
  } else if (discipline === 'swim') {
    resolved = tryZone(zones.swimPace, 'pace', formatSwimPace, 'Ta CSS testée pilote cette cible.')
  }

  if (resolved) return resolved

  return {
    measurementMethod: 'rpe',
    targetDescription: `RPE ${rpeRange[0]}-${rpeRange[1]}`,
    rpeRange,
    usesTestedMetric: false,
    explanation: 'Aucune donnée testée disponible pour cette discipline : le ressenti (RPE) pilote cette cible.',
  }
}
