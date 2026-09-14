import type { Level } from '@/shared/types/common'

export type Sport = 'triathlon' | 'running'

export type TriathlonExperience = 'first-triathlon' | 'some-races' | 'experienced'

/** Same three-tier shape as `TriathlonExperience`, kept as its own type
 * (rather than reused) because "first-triathlon" doesn't read naturally
 * for a runner's first time at a given distance. */
export type RunningExperience = 'first-time-at-distance' | 'some-races' | 'experienced'

/** `swim`/`bike` are only asked for a triathlon goal — `run` is the one
 * level every athlete declares, triathlete or runner alike. */
export interface DisciplineLevels {
  run: Level
  swim?: Level
  bike?: Level
}

/** All optional: FTP/CSS/threshold HR must never be mandatory (brief §20). */
export interface KnownMetrics {
  maxHeartRate?: number
  thresholdHeartRate?: number
  ftpWatts?: number
  /** CSS pace, seconds per 100m. */
  cssSecPer100m?: number
  /** Running threshold pace, seconds per km. */
  thresholdPaceSecPerKm?: number
}

export interface Equipment {
  hasPoolAccess: boolean
  poolDaysPerWeek?: number
  hasBike: boolean
  hasHomeTrainer: boolean
}

/** Self-declared, used only where it has an actual, defensible effect on a
 * calculation (currently: which population-average reference band a
 * power-to-weight ratio falls in — see `engine/calibration/powerToWeight.ts`).
 * `unspecified` skips any sex-specific adjustment rather than guessing. */
export type BiologicalSex = 'female' | 'male' | 'unspecified'

/** All optional (brief §20): asked once at onboarding, never required to
 * get a plan. Used for exactly two things — see docs/metrics.md — never
 * for a health/BMI judgment or any diagnosis. */
export interface Biometrics {
  sex?: BiologicalSex
  heightCm?: number
  weightKg?: number
}

export interface AthleteProfile {
  id: string
  createdAt: string
  sport: Sport
  generalSportExperience: Level
  /** Only set when `sport === 'triathlon'`. */
  triathlonExperience?: TriathlonExperience
  /** Only set when `sport === 'running'`. */
  runningExperience?: RunningExperience
  disciplineLevels: DisciplineLevels
  /** Recent typical training volume, hours/week. Optional — a first-timer may not know this. */
  recentWeeklyVolumeHours?: number
  equipment: Equipment
  knownMetrics: KnownMetrics
  biometrics: Biometrics
  /** Free-text habitual constraints the engine cannot infer structurally (brief §20). */
  constraintsNote?: string
}

export function createAthleteProfile(
  input: Omit<AthleteProfile, 'id' | 'createdAt'>,
): AthleteProfile {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}
