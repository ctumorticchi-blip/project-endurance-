import type { BiologicalSex, Equipment, KnownMetrics, RunningExperience, Sport, TriathlonExperience } from '@/core/athlete/AthleteProfile'
import type { AvailabilityException, WeeklyPattern } from '@/core/availability/Availability'
import { createEmptyWeeklyPattern } from '@/core/availability/Availability'
import type { RunningDistance } from '@/sports/running/domain/distance'
import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import type { DateISO, Level, Weekday } from '@/shared/types/common'

/**
 * One draft object accumulated across onboarding steps, later split into
 * AthleteProfile / RaceGoal / Availability on submit. Kept flat and
 * partial so each step only needs to know its own slice. A single step
 * array is shared by both sports (see `ONBOARDING_STEPS`) — each step's
 * rendered content branches internally on `sport` instead of the flow
 * adding/removing steps, so `stepIndex` never needs to shift meaning.
 */
export interface OnboardingDraft {
  sport: Sport
  distance?: TriathlonDistance | RunningDistance
  raceDate?: DateISO
  raceName?: string

  generalSportExperience?: Level
  triathlonExperience?: TriathlonExperience
  runningExperience?: RunningExperience
  swimLevel?: Level
  bikeLevel?: Level
  runLevel?: Level
  recentWeeklyVolumeHours?: number

  equipment: Equipment
  knownMetrics: KnownMetrics
  sex?: BiologicalSex
  heightCm?: number
  weightKg?: number

  weeklyPattern: WeeklyPattern
  exceptions: AvailabilityException[]
  /** Weekday(s) explicitly chosen as rest days — always at least one
   * before the athlete can continue past the availability step. */
  restDays: Weekday[]

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
    sport: 'triathlon',
    equipment: { hasPoolAccess: false, hasBike: true, hasHomeTrainer: false },
    knownMetrics: {},
    weeklyPattern: createEmptyWeeklyPattern(),
    exceptions: [],
    restDays: [],
  }
}

function hasCompleteExperience(draft: OnboardingDraft): boolean {
  if (!draft.generalSportExperience) return false
  return draft.sport === 'triathlon'
    ? Boolean(draft.triathlonExperience && draft.swimLevel && draft.bikeLevel && draft.runLevel)
    : Boolean(draft.runningExperience && draft.runLevel)
}

export function isDraftCompleteEnoughToSubmit(draft: OnboardingDraft): boolean {
  const hasGoal = Boolean(draft.distance && draft.raceDate)
  const hasAtLeastOneAvailableDay = Object.values(draft.weeklyPattern).some(
    (d) => d.available && d.minutes > 0,
  )
  return hasGoal && hasCompleteExperience(draft) && hasAtLeastOneAvailableDay
}
