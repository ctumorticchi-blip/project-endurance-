import { RUNNING_DISTANCES } from '@/sports/running/domain/distance'
import { TRIATHLON_DISTANCES } from '@/sports/triathlon/domain/distance'
import type { RaceGoal } from './RaceGoal'

/**
 * The one place that narrows a `RaceGoal` on `sport` to look up its
 * distance spec — every screen that needs a label or a beginner-runway
 * warning goes through here instead of re-deriving the branch itself.
 */
export function getRaceDistanceLabel(raceGoal: RaceGoal): string {
  return raceGoal.sport === 'triathlon'
    ? TRIATHLON_DISTANCES[raceGoal.distance].label
    : RUNNING_DISTANCES[raceGoal.distance].label
}

export function getRecommendedMinWeeksBeginner(raceGoal: RaceGoal): number {
  return raceGoal.sport === 'triathlon'
    ? TRIATHLON_DISTANCES[raceGoal.distance].recommendedMinWeeksBeginner
    : RUNNING_DISTANCES[raceGoal.distance].recommendedMinWeeksBeginner
}
