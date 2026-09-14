/**
 * Standalone running program (M6 of `docs/roadmap.md`) — first sport
 * added alongside triathlon, sharing the same Athlete Model / Coach
 * Engine / Metrics Engine rather than a fresh rewrite. Four road race
 * distances, the ones an amateur runner actually targets.
 */
export type RunningDistance = '5k' | '10k' | 'half-marathon' | 'marathon'

export interface RunningDistanceSpec {
  label: string
  km: number
  /**
   * Typical minimum weeks a beginner needs to prepare safely — grounded in
   * widely-used published plans for each distance (Daniels' Running
   * Formula 5K/10K plans, Hal Higdon's Novice half-marathon program,
   * Pfitzinger & Douglas's "Advanced Marathoning" / Hansons Marathon
   * Method novice plans), not an invented number. Used to warn, never to
   * silently generate a dangerously aggressive plan (same rule as
   * triathlon — brief §16).
   */
  recommendedMinWeeksBeginner: number
  /**
   * Taper length in weeks before race day. Short for 5K/10K (fatigue
   * clears in days, per Daniels), longer for the marathon (Pfitzinger
   * recommends ~2-3 weeks to fully absorb the accumulated training load
   * without losing fitness).
   */
  taperWeeks: number
}

export const RUNNING_DISTANCES: Record<RunningDistance, RunningDistanceSpec> = {
  '5k': { label: '5 km', km: 5, recommendedMinWeeksBeginner: 6, taperWeeks: 1 },
  '10k': { label: '10 km', km: 10, recommendedMinWeeksBeginner: 8, taperWeeks: 1 },
  'half-marathon': { label: 'Semi-marathon', km: 21.1, recommendedMinWeeksBeginner: 10, taperWeeks: 2 },
  marathon: { label: 'Marathon', km: 42.2, recommendedMinWeeksBeginner: 16, taperWeeks: 2 },
}
