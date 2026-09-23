import { describe, expect, it } from 'vitest'
import type { AthleteZones } from '@/engine/calibration/calculateAthleteZones'
import type { Zone } from '@/engine/calibration/zones'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import { resolveIntensityPrescription } from './resolveIntensityPrescription'

function block(overrides: Partial<WorkoutBlock> = {}): WorkoutBlock {
  return {
    id: 'b1',
    label: 'Bloc',
    durationSec: 600,
    targetZone: 'Z4',
    targetRpeMin: 7,
    targetRpeMax: 8,
    ...overrides,
  }
}

const POWER_ZONES: Zone[] = [
  { name: 'Z1', label: 'Récup', min: 0, max: 120 },
  { name: 'Z2', label: 'Endurance', min: 121, max: 165 },
  { name: 'Z3', label: 'Tempo', min: 166, max: 198 },
  { name: 'Z4', label: 'Seuil', min: 199, max: 231 },
  { name: 'Z5', label: 'VO2max', min: 232, max: Infinity },
]

const HR_ZONES: Zone[] = [
  { name: 'Z1', label: 'Récup', min: 100, max: 130 },
  { name: 'Z2', label: 'Endurance', min: 131, max: 145 },
  { name: 'Z3', label: 'Tempo', min: 146, max: 155 },
  { name: 'Z4', label: 'Seuil', min: 156, max: 168 },
  { name: 'Z5', label: 'VO2max', min: 169, max: Infinity },
]

const RUN_PACE_ZONES: Zone[] = [
  { name: 'Z1', label: 'Récup', min: 360, max: 420 },
  { name: 'Z2', label: 'Endurance', min: 320, max: 359 },
  { name: 'Z3', label: 'Tempo', min: 290, max: 319 },
  { name: 'Z4', label: 'Seuil', min: 270, max: 289 },
  { name: 'Z5', label: 'VO2max', min: 0, max: 269 },
]

describe('resolveIntensityPrescription', () => {
  it('uses power for bike when FTP-derived power zones are known', () => {
    const zones: AthleteZones = { power: POWER_ZONES, heartRate: HR_ZONES }
    const result = resolveIntensityPrescription({ discipline: 'bike', block: block(), zones })
    expect(result.measurementMethod).toBe('power')
    expect(result.usesTestedMetric).toBe(true)
    expect(result.targetDescription).toMatch(/W/)
    expect(result.rpeRange).toEqual([7, 8])
  })

  it('falls back to heart rate for bike when power is unknown but HR is', () => {
    const zones: AthleteZones = { heartRate: HR_ZONES }
    const result = resolveIntensityPrescription({ discipline: 'bike', block: block(), zones })
    expect(result.measurementMethod).toBe('heartRate')
    expect(result.targetDescription).toMatch(/bpm/)
  })

  it('falls back to RPE alone for bike when nothing is known', () => {
    const result = resolveIntensityPrescription({ discipline: 'bike', block: block(), zones: {} })
    expect(result.measurementMethod).toBe('rpe')
    expect(result.usesTestedMetric).toBe(false)
    expect(result.targetDescription).toBe('RPE 7-8')
  })

  it('uses pace for run when threshold pace is known, even if heart rate is also known', () => {
    const zones: AthleteZones = { runPace: RUN_PACE_ZONES, heartRate: HR_ZONES }
    const result = resolveIntensityPrescription({ discipline: 'run', block: block(), zones })
    expect(result.measurementMethod).toBe('pace')
    expect(result.targetDescription).toMatch(/\/km/)
  })

  it('never uses heart rate for swim, even when known — falls straight to RPE', () => {
    const zones: AthleteZones = { heartRate: HR_ZONES }
    const result = resolveIntensityPrescription({ discipline: 'swim', block: block(), zones })
    expect(result.measurementMethod).toBe('rpe')
  })

  it('uses RPE for strength (no zone system applies)', () => {
    const result = resolveIntensityPrescription({
      discipline: 'strength',
      block: block({ targetZone: undefined }),
      zones: { power: POWER_ZONES, heartRate: HR_ZONES, runPace: RUN_PACE_ZONES },
    })
    expect(result.measurementMethod).toBe('rpe')
  })

  it('always includes an RPE range as the universal cross-check, even with a precise metric', () => {
    const zones: AthleteZones = { power: POWER_ZONES }
    const result = resolveIntensityPrescription({ discipline: 'bike', block: block({ targetRpeMin: 6, targetRpeMax: 7 }), zones })
    expect(result.rpeRange).toEqual([6, 7])
  })

  it('renders the top zone (Infinity max) as an open-ended "+" target instead of crashing', () => {
    const zones: AthleteZones = { power: POWER_ZONES }
    const result = resolveIntensityPrescription({ discipline: 'bike', block: block({ targetZone: 'Z5' }), zones })
    expect(result.targetDescription).toMatch(/\+/)
  })
})
