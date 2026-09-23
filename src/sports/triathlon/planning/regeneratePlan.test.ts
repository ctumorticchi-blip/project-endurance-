import { describe, expect, it } from 'vitest'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { allSessions } from '@/core/training/TrainingPlan'
import { generateTrainingPlan } from './generateTrainingPlan'
import { regeneratePlanFromToday } from './regeneratePlan'

/** A balanced intermediate triathlete — the Weekly Stimulus Composer needs
 * an `AthleteProfile` to compose from (Training Intelligence V2). */
const TEST_ATHLETE_PROFILE = createAthleteProfile({
  sport: 'triathlon',
  generalSportExperience: 'intermediate',
  triathlonExperience: 'some-races',
  disciplineLevels: { swim: 'intermediate', bike: 'intermediate', run: 'intermediate' },
  equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
  knownMetrics: {},
  biometrics: {},
})

function fullAvailability(restDays: Availability['restDays'] = ['sunday']): Availability {
  const pattern = createEmptyWeeklyPattern()
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const) {
    pattern[day] = { available: true, minutes: 90, poolAccess: true }
  }
  return { weeklyPattern: pattern, exceptions: [], restDays }
}

describe('regeneratePlanFromToday', () => {
  it('keeps every week strictly before the current one untouched', () => {
    const today = new Date('2026-01-05T00:00:00') // a Monday
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' })
    const { plan: originalPlan } = generateTrainingPlan({ raceGoal, availability: fullAvailability(), athleteProfile: TEST_ATHLETE_PROFILE, today })

    // Pretend two weeks have already elapsed since the plan was created.
    const twoWeeksLater = new Date('2026-01-19T00:00:00')
    const { plan: regenerated } = regeneratePlanFromToday({
      currentPlan: originalPlan,
      raceGoal,
      availability: fullAvailability(['saturday']), // changed rest day
      athleteProfile: TEST_ATHLETE_PROFILE,
      today: twoWeeksLater,
    })

    const pastWeeks = originalPlan.weeks.filter((w) => w.startDate < '2026-01-19')
    expect(regenerated.weeks.slice(0, pastWeeks.length)).toEqual(pastWeeks)
  })

  it('applies the new availability from the current week onward', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' })
    const { plan: originalPlan } = generateTrainingPlan({ raceGoal, availability: fullAvailability(['sunday']), athleteProfile: TEST_ATHLETE_PROFILE, today })

    const twoWeeksLater = new Date('2026-01-19T00:00:00')
    const { plan: regenerated } = regeneratePlanFromToday({
      currentPlan: originalPlan,
      raceGoal,
      availability: fullAvailability(['saturday']),
      athleteProfile: TEST_ATHLETE_PROFILE,
      today: twoWeeksLater,
    })

    // Every session from today onward must respect the new rest day
    // (Saturday), not the old one (Sunday).
    for (const session of allSessions(regenerated)) {
      if (session.date >= '2026-01-19') {
        expect(new Date(session.date).getDay()).not.toBe(6) // 6 = Saturday
      }
    }
  })

  it('renumbers weeks sequentially after splicing past and regenerated weeks', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' })
    const { plan: originalPlan } = generateTrainingPlan({ raceGoal, availability: fullAvailability(), athleteProfile: TEST_ATHLETE_PROFILE, today })

    const twoWeeksLater = new Date('2026-01-19T00:00:00')
    const { plan: regenerated } = regeneratePlanFromToday({
      currentPlan: originalPlan,
      raceGoal,
      availability: fullAvailability(),
      athleteProfile: TEST_ATHLETE_PROFILE,
      today: twoWeeksLater,
    })

    const weekNumbers = regenerated.weeks.map((w) => w.weekNumber)
    expect(weekNumbers).toEqual(Array.from({ length: weekNumbers.length }, (_, i) => i + 1))
  })

  it('never places a newly-regenerated session before the current week starts', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' })
    const { plan: originalPlan } = generateTrainingPlan({ raceGoal, availability: fullAvailability(), athleteProfile: TEST_ATHLETE_PROFILE, today })

    const twoWeeksLater = new Date('2026-01-19T00:00:00')
    const { plan: regenerated } = regeneratePlanFromToday({
      currentPlan: originalPlan,
      raceGoal,
      availability: fullAvailability(),
      athleteProfile: TEST_ATHLETE_PROFILE,
      today: twoWeeksLater,
    })

    const pastWeeks = originalPlan.weeks.filter((w) => w.startDate < '2026-01-19')
    const regeneratedWeeks = regenerated.weeks.slice(pastWeeks.length)
    for (const week of regeneratedWeeks) {
      for (const session of week.sessions) {
        expect(session.date >= regeneratedWeeks[0]!.startDate).toBe(true)
      }
    }
  })
})
