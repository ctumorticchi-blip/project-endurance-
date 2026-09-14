import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import type { Availability } from '@/core/availability/Availability'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import type { RunningDistance } from '@/sports/running/domain/distance'
import { generateRunningPlan } from '@/sports/running/planning/generateRunningPlan'
import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import { generateTrainingPlan } from '@/sports/triathlon/planning/generateTrainingPlan'
import type { OnboardingDraft } from './onboardingState'

/**
 * Splits the flat onboarding draft into the three domain aggregates,
 * persists them, then generates and persists the first training plan —
 * branching on `draft.sport` to build the right `AthleteProfile`/`RaceGoal`
 * shape and call the matching plan generator. Throws if required fields
 * are missing — callers must gate this behind
 * `isDraftCompleteEnoughToSubmit` first.
 */
export function submitOnboarding(draft: OnboardingDraft): { planWarnings: string[] } {
  if (!draft.distance || !draft.raceDate) {
    throw new Error('Cannot submit onboarding: race goal is incomplete')
  }
  if (!draft.generalSportExperience) {
    throw new Error('Cannot submit onboarding: experience is incomplete')
  }
  if (!draft.runLevel) {
    throw new Error('Cannot submit onboarding: discipline levels are incomplete')
  }

  const availability: Availability = {
    weeklyPattern: draft.weeklyPattern,
    exceptions: draft.exceptions,
    restDays: draft.restDays,
  }

  if (draft.sport === 'running') {
    if (!draft.runningExperience) {
      throw new Error('Cannot submit onboarding: experience is incomplete')
    }

    const profile = createAthleteProfile({
      sport: 'running',
      generalSportExperience: draft.generalSportExperience,
      runningExperience: draft.runningExperience,
      disciplineLevels: { run: draft.runLevel },
      recentWeeklyVolumeHours: draft.recentWeeklyVolumeHours,
      equipment: draft.equipment,
      knownMetrics: draft.knownMetrics,
      biometrics: { sex: draft.sex, heightCm: draft.heightCm, weightKg: draft.weightKg },
      constraintsNote: draft.constraintsNote,
    })

    const raceGoal = createRaceGoal({
      sport: 'running',
      distance: draft.distance as RunningDistance,
      raceDate: draft.raceDate,
      raceName: draft.raceName,
    })

    AthleteProfileRepository.save(profile)
    RaceGoalRepository.save(raceGoal)
    AvailabilityRepository.save(availability)

    const { plan, warnings } = generateRunningPlan({ raceGoal, availability })
    TrainingPlanRepository.save(plan)

    return { planWarnings: warnings }
  }

  if (!draft.triathlonExperience || !draft.swimLevel || !draft.bikeLevel) {
    throw new Error('Cannot submit onboarding: discipline levels are incomplete')
  }

  const profile = createAthleteProfile({
    sport: 'triathlon',
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
    biometrics: { sex: draft.sex, heightCm: draft.heightCm, weightKg: draft.weightKg },
    constraintsNote: draft.constraintsNote,
  })

  const raceGoal = createRaceGoal({
    sport: 'triathlon',
    distance: draft.distance as TriathlonDistance,
    raceDate: draft.raceDate,
    raceName: draft.raceName,
  })

  AthleteProfileRepository.save(profile)
  RaceGoalRepository.save(raceGoal)
  AvailabilityRepository.save(availability)

  const { plan, warnings } = generateTrainingPlan({ raceGoal, availability })
  TrainingPlanRepository.save(plan)

  return { planWarnings: warnings }
}
