import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import type { OnboardingDraft } from './onboardingState'

/**
 * Splits the flat onboarding draft into the three domain aggregates and
 * persists them. Throws if required fields are missing — callers must gate
 * this behind `isDraftCompleteEnoughToSubmit` first.
 */
export function submitOnboarding(draft: OnboardingDraft): void {
  if (!draft.distance || !draft.raceDate) {
    throw new Error('Cannot submit onboarding: race goal is incomplete')
  }
  if (!draft.generalSportExperience || !draft.triathlonExperience) {
    throw new Error('Cannot submit onboarding: experience is incomplete')
  }
  if (!draft.swimLevel || !draft.bikeLevel || !draft.runLevel) {
    throw new Error('Cannot submit onboarding: discipline levels are incomplete')
  }

  const profile = createAthleteProfile({
    generalSportExperience: draft.generalSportExperience,
    triathlonExperience: draft.triathlonExperience,
    disciplineLevels: {
      swim: draft.swimLevel,
      bike: draft.bikeLevel,
      run: draft.runLevel,
    },
    recentWeeklyVolumeHours: draft.recentWeeklyVolumeHours,
    equipment: draft.equipment,
    knownMetrics: draft.knownMetrics,
    constraintsNote: draft.constraintsNote,
  })

  const raceGoal = createRaceGoal({
    distance: draft.distance,
    raceDate: draft.raceDate,
    raceName: draft.raceName,
  })

  AthleteProfileRepository.save(profile)
  RaceGoalRepository.save(raceGoal)
  AvailabilityRepository.save({
    weeklyPattern: draft.weeklyPattern,
    exceptions: draft.exceptions,
  })
}
