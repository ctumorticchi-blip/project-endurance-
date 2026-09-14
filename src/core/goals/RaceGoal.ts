import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import type { RunningDistance } from '@/sports/running/domain/distance'
import type { DateISO } from '@/shared/types/common'

interface RaceGoalBase {
  id: string
  raceDate: DateISO
  raceName?: string
  createdAt: string
}

export interface TriathlonRaceGoal extends RaceGoalBase {
  sport: 'triathlon'
  distance: TriathlonDistance
}

export interface RunningRaceGoal extends RaceGoalBase {
  sport: 'running'
  distance: RunningDistance
}

/**
 * A discriminated union on `sport` — the shape the original one-sport
 * comment on this file anticipated ("a future sport would add a member
 * here"). Every consumer that needs the distance spec table (labels,
 * warnings, race-day nutrition guidance) must narrow on `sport` first —
 * see `core/goals/raceGoalDisplay.ts` for the one shared place that does.
 */
export type RaceGoal = TriathlonRaceGoal | RunningRaceGoal

export function createRaceGoal(input: Omit<TriathlonRaceGoal, 'id' | 'createdAt'>): TriathlonRaceGoal
export function createRaceGoal(input: Omit<RunningRaceGoal, 'id' | 'createdAt'>): RunningRaceGoal
export function createRaceGoal(
  input: Omit<TriathlonRaceGoal, 'id' | 'createdAt'> | Omit<RunningRaceGoal, 'id' | 'createdAt'>,
): RaceGoal {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}

/** Whole days between today and the race, floor at 0. */
export function daysUntilRace(raceDate: DateISO, today: Date = new Date()): number {
  const race = new Date(raceDate)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfRace = new Date(race.getFullYear(), race.getMonth(), race.getDate())
  const diffMs = startOfRace.getTime() - startOfToday.getTime()
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
}

export function weeksUntilRace(raceDate: DateISO, today: Date = new Date()): number {
  return Math.floor(daysUntilRace(raceDate, today) / 7)
}
