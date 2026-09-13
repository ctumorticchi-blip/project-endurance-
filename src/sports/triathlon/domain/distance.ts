/** M0 supports Sprint and Olympic ("M") only — not 70.3/Ironman (brief §15). */
export type TriathlonDistance = 'sprint' | 'olympic'

export interface TriathlonDistanceSpec {
  label: string
  swimMeters: number
  bikeKm: number
  runKm: number
  /** Typical minimum weeks a beginner needs to prepare safely. Used to warn,
   * never to silently generate a dangerously aggressive plan (brief §16). */
  recommendedMinWeeksBeginner: number
}

export const TRIATHLON_DISTANCES: Record<TriathlonDistance, TriathlonDistanceSpec> = {
  sprint: {
    label: 'Sprint',
    swimMeters: 750,
    bikeKm: 20,
    runKm: 5,
    recommendedMinWeeksBeginner: 8,
  },
  olympic: {
    label: 'M',
    swimMeters: 1500,
    bikeKm: 40,
    runKm: 10,
    recommendedMinWeeksBeginner: 12,
  },
}
