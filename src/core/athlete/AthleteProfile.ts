import type { Level } from '@/shared/types/common'

export type TriathlonExperience = 'first-triathlon' | 'some-races' | 'experienced'

export interface DisciplineLevels {
  swim: Level
  bike: Level
  run: Level
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

export interface AthleteProfile {
  id: string
  createdAt: string
  generalSportExperience: Level
  triathlonExperience: TriathlonExperience
  disciplineLevels: DisciplineLevels
  /** Recent typical training volume, hours/week. Optional — a first-timer may not know this. */
  recentWeeklyVolumeHours?: number
  equipment: Equipment
  knownMetrics: KnownMetrics
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
