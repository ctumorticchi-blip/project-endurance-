import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import { splitProportional } from '@/sports/triathlon/planning/phaseAllocation'
import { RUNNING_DISTANCES, type RunningDistance } from '@/sports/running/domain/distance'

const RACE_WEEKS = 1

/**
 * Distance-specific base/build/specific split — the same three-phase
 * skeleton as triathlon, but the balance between aerobic base and
 * race-specific sharpening shifts with distance, exactly as real marathon
 * vs. 5K training differs: Pfitzinger/Hansons/Lydiard all give the
 * marathon a longer aerobic base and a shorter, less aggressive specific
 * phase (the cost of getting VO2max work wrong is high fatigue for a race
 * that's barely VO2max-limited), while Daniels/Canova give the 5K/10K a
 * shorter base and a longer specific phase built on I/R-pace work, since
 * VO2max and running economy are much larger limiters at that distance.
 */
const PHASE_RATIOS_BY_DISTANCE: Record<RunningDistance, [TrainingPhaseName, number][]> = {
  '5k': [
    ['base', 0.35],
    ['build', 0.3],
    ['specific', 0.35],
  ],
  '10k': [
    ['base', 0.38],
    ['build', 0.32],
    ['specific', 0.3],
  ],
  'half-marathon': [
    ['base', 0.42],
    ['build', 0.33],
    ['specific', 0.25],
  ],
  marathon: [
    ['base', 0.48],
    ['build', 0.32],
    ['specific', 0.2],
  ],
}

/**
 * Builds the race-backwards phase for every week of the plan (index 0 =
 * first week) — same fallback rule as triathlon's allocator: when the
 * runway is too short to fit a taper and a race week separately, everything
 * but the last week becomes taper rather than a silently aggressive plan.
 */
export function allocatePhases(totalWeeks: number, distance: RunningDistance): TrainingPhaseName[] {
  const taperWeeks = RUNNING_DISTANCES[distance].taperWeeks

  if (totalWeeks <= taperWeeks + RACE_WEEKS) {
    return Array.from({ length: totalWeeks }, (_, i) => (i === totalWeeks - 1 ? 'race' : 'taper'))
  }

  const remaining = totalWeeks - taperWeeks - RACE_WEEKS
  const ratios = PHASE_RATIOS_BY_DISTANCE[distance]
  const [baseWeeks = 0, buildWeeks = 0, specificWeeks = 0] = splitProportional(
    remaining,
    ratios.map(([, ratio]) => ratio),
  )

  return [
    ...Array<TrainingPhaseName>(baseWeeks).fill('base'),
    ...Array<TrainingPhaseName>(buildWeeks).fill('build'),
    ...Array<TrainingPhaseName>(specificWeeks).fill('specific'),
    ...Array<TrainingPhaseName>(taperWeeks).fill('taper'),
    ...Array<TrainingPhaseName>(RACE_WEEKS).fill('race'),
  ]
}
