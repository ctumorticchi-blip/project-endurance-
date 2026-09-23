import { createAthleteProfile, type AthleteProfile } from '@/core/athlete/AthleteProfile'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createRaceGoal, type TriathlonRaceGoal } from '@/core/goals/RaceGoal'

/**
 * Training Intelligence V2's canonical benchmark athlete (brief §32) —
 * used for the 16-week Gold Standard generation/review (`goldStandard.test.ts`)
 * and as entry #03 of the benchmark matrix (`benchmarkMatrix.test.ts`).
 *
 * Profile: Olympic/M triathlon, 16-week preparation, intermediate overall
 * with at least one prior Sprint, weak/intermediate swim, intermediate
 * bike, good (advanced) run — a deliberately unbalanced athlete so the
 * limiter-aware Weekly Stimulus Composer has real work to do. ~6h/week
 * across up to 6 training days. Full data: HR + GPS (threshold HR and
 * threshold pace known), FTP known, CSS known — performance-focused, not
 * just "finish the race".
 */
export const GOLD_STANDARD_RACE_DATE = '2026-11-15'
// generateTrainingPlan() counts totalDays inclusively (daysUntilRace + 1)
// before rounding up to whole weeks, so the raw calendar gap must be 111
// days (not a clean 112 = 16*7) to land on exactly 16 generated weeks.
export const GOLD_STANDARD_TODAY = new Date('2026-07-27T00:00:00')

export function createGoldStandardRaceGoal(): TriathlonRaceGoal {
  return createRaceGoal({
    sport: 'triathlon',
    distance: 'olympic',
    raceDate: GOLD_STANDARD_RACE_DATE,
    raceName: 'Triathlon Gold Standard M',
  })
}

export function createGoldStandardAthlete(): AthleteProfile {
  return createAthleteProfile({
    sport: 'triathlon',
    generalSportExperience: 'intermediate',
    triathlonExperience: 'some-races', // at least one prior Sprint
    disciplineLevels: { swim: 'beginner', bike: 'intermediate', run: 'advanced' },
    recentWeeklyVolumeHours: 6,
    equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
    knownMetrics: {
      maxHeartRate: 188,
      thresholdHeartRate: 165,
      ftpWatts: 220,
      cssSecPer100m: 100, // 1:40/100m
      thresholdPaceSecPerKm: 270, // 4:30/km
    },
    biometrics: { sex: 'unspecified', heightCm: 178, weightKg: 72 },
    constraintsNote: undefined,
  })
}

/** ~6h/week across 6 training days (Monday rest), pool access Tue/Thu. */
export function createGoldStandardAvailability(): Availability {
  const pattern = createEmptyWeeklyPattern()
  pattern.tuesday = { available: true, minutes: 60, poolAccess: true }
  pattern.wednesday = { available: true, minutes: 60, poolAccess: false }
  pattern.thursday = { available: true, minutes: 60, poolAccess: true }
  pattern.friday = { available: true, minutes: 45, poolAccess: false }
  pattern.saturday = { available: true, minutes: 90, poolAccess: false }
  pattern.sunday = { available: true, minutes: 45, poolAccess: false }
  return { weeklyPattern: pattern, exceptions: [], restDays: ['monday'] }
}
