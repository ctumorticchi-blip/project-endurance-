import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'

/** Sprint tapers for 1 week, Olympic ("M") for 2 — brief §16/§18. */
const TAPER_WEEKS_BY_DISTANCE: Record<TriathlonDistance, number> = {
  sprint: 1,
  olympic: 2,
}

const RACE_WEEKS = 1

const PHASE_RATIOS: [Exclude<TrainingPhaseName, 'taper' | 'race'>, number][] = [
  ['base', 0.4],
  ['build', 0.35],
  ['specific', 0.25],
]

/** Largest-remainder apportionment: splits `total` whole weeks across
 * `ratios` while keeping every non-empty bucket the moment there is
 * enough runway (`total >= ratios.length`) to give each phase a week.
 * Exported for reuse by other sports' phase allocation (e.g. running's
 * own per-distance ratios) — the algorithm itself has no triathlon
 * assumptions baked in. */
export function splitProportional(total: number, ratios: number[]): number[] {
  const raw = ratios.map((r) => r * total)
  const result = raw.map(Math.floor)
  let remainder = total - result.reduce((a, b) => a + b, 0)

  const byFractionDesc = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)

  for (const { index } of byFractionDesc) {
    if (remainder <= 0) break
    result[index] = (result[index] ?? 0) + 1
    remainder--
  }

  if (total >= ratios.length) {
    for (let i = 0; i < result.length; i++) {
      if (result[i] === 0) {
        const maxIndex = result.indexOf(Math.max(...result))
        result[maxIndex]! -= 1
        result[i] = 1
      }
    }
  }

  return result
}

/**
 * Builds the race-backwards phase for every week of the plan (index 0 =
 * first week). When the runway is too short to fit a taper and a race
 * week separately, everything but the last week becomes taper — never a
 * silently aggressive full-intensity plan (brief §16).
 */
export function allocatePhases(totalWeeks: number, distance: TriathlonDistance): TrainingPhaseName[] {
  const taperWeeks = TAPER_WEEKS_BY_DISTANCE[distance]

  if (totalWeeks <= taperWeeks + RACE_WEEKS) {
    return Array.from({ length: totalWeeks }, (_, i) =>
      i === totalWeeks - 1 ? 'race' : 'taper',
    )
  }

  const remaining = totalWeeks - taperWeeks - RACE_WEEKS
  const [baseWeeks = 0, buildWeeks = 0, specificWeeks = 0] = splitProportional(
    remaining,
    PHASE_RATIOS.map(([, ratio]) => ratio),
  )

  return [
    ...Array<TrainingPhaseName>(baseWeeks).fill('base'),
    ...Array<TrainingPhaseName>(buildWeeks).fill('build'),
    ...Array<TrainingPhaseName>(specificWeeks).fill('specific'),
    ...Array<TrainingPhaseName>(taperWeeks).fill('taper'),
    ...Array<TrainingPhaseName>(RACE_WEEKS).fill('race'),
  ]
}
