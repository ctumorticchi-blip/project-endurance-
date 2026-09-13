import { AthleteProfileRepository } from './athlete/AthleteProfileRepository'
import { AvailabilityRepository } from './availability/AvailabilityRepository'
import { RaceGoalRepository } from './goals/RaceGoalRepository'

export function isOnboardingComplete(): boolean {
  return Boolean(
    AthleteProfileRepository.load() && RaceGoalRepository.load() && AvailabilityRepository.load(),
  )
}
