import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import type { DateISO } from '@/shared/types/common'

/**
 * `sport` is a literal union of one value on purpose: it documents that a
 * future sport would add a member here (and its own distance type) without
 * a premature generic `SportModule` abstraction (YAGNI — brief §37/§60).
 */
export interface RaceGoal {
  id: string
  sport: 'triathlon'
  distance: TriathlonDistance
  raceDate: DateISO
  raceName?: string
  createdAt: string
}

export function createRaceGoal(
  input: Omit<RaceGoal, 'id' | 'sport' | 'createdAt'>,
): RaceGoal {
  return {
    ...input,
    id: crypto.randomUUID(),
    sport: 'triathlon',
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
