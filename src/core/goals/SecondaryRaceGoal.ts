import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import type { DateISO } from '@/shared/types/common'

/**
 * A "B/C race" the athlete wants tracked alongside the main objective —
 * purely informational (brief feedback: display only, for now). It never
 * touches plan generation or periodization: the program keeps building
 * toward the main `RaceGoal` exactly as if this didn't exist. A future
 * milestone could make the generator actually taper around these (see
 * `docs/roadmap.md`), but that is a materially bigger change than this one.
 */
export interface SecondaryRaceGoal {
  id: string
  raceName: string
  raceDate: DateISO
  distance?: TriathlonDistance
  createdAt: string
}

export function createSecondaryRaceGoal(
  input: Omit<SecondaryRaceGoal, 'id' | 'createdAt'>,
): SecondaryRaceGoal {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}
