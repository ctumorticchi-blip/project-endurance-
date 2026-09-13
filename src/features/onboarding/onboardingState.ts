import type { Equipment, KnownMetrics } from '@/core/athlete/AthleteProfile'
import type { AvailabilityException, WeeklyPattern } from '@/core/availability/Availability'
import { createEmptyWeeklyPattern } from '@/core/availability/Availability'
import type { TriathlonExperience } from '@/core/athlete/AthleteProfile'
import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import type { DateISO, Level } from '@/shared/types/common'

/**
 * One draft object accumulated across onboarding steps, later split into
 * AthleteProfile / RaceGoal / Availability on submit. Kept flat and
 * partial so each step only needs to know its own slice.
 */
export interface OnboardingDraft {
  distance?: TriathlonDistance
  raceDate?: DateISO
  raceName?: string

  generalSportExperience?: Level
  triathlonExperience?: TriathlonExperience
  swimLevel?: Level
  bikeLevel?: Level
  runLevel?: Level
  recentWeeklyVolumeHours?: number

  equipment: Equipment
  knownMetrics: KnownMetrics

  weeklyPattern: WeeklyPattern
  exceptions: AvailabilityException[]

  constraintsNote?: string
}

export const ONBOARDING_STEPS = [
  'race-goal',
  'experience',
  'equipment',
  'metrics',
  'availability',
  'review',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]

export function createInitialDraft(): OnboardingDraft {
  return {
    equipment: { hasPoolAccess: false, hasBike: true, hasHomeTrainer: false },
    knownMetrics: {},
    weeklyPattern: createEmptyWeeklyPattern(),
    exceptions: [],
  }
}

export function isDraftCompleteEnoughToSubmit(draft: OnboardingDraft): boolean {
  const hasGoal = Boolean(draft.distance && draft.raceDate)
  const hasExperience = Boolean(
    draft.generalSportExperience && draft.triathlonExperience && draft.swimLevel && draft.bikeLevel && draft.runLevel,
  )
  const hasAtLeastOneAvailableDay = Object.values(draft.weeklyPattern).some(
    (d) => d.available && d.minutes > 0,
  )
  return hasGoal && hasExperience && hasAtLeastOneAvailableDay
}
