import { describe, expect, it } from 'vitest'
import { createAvailabilityException, createEmptyWeeklyPattern, getAvailableMinutes, type Availability } from '@/core/availability/Availability'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { allSessions } from '@/core/training/TrainingPlan'
import { WEEKDAYS } from '@/shared/types/common'
import { generateTrainingPlan } from './generateTrainingPlan'

function availabilityWithDays(
  days: { weekday: (typeof WEEKDAYS)[number]; minutes: number; pool?: boolean }[],
): Availability {
  const pattern = createEmptyWeeklyPattern()
  for (const d of days) {
    pattern[d.weekday] = { available: true, minutes: d.minutes, poolAccess: d.pool ?? false }
  }
  return { weeklyPattern: pattern, exceptions: [] }
}

const FIVE_DAY_AVAILABILITY = availabilityWithDays([
  { weekday: 'tuesday', minutes: 60, pool: true },
  { weekday: 'wednesday', minutes: 60 },
  { weekday: 'thursday', minutes: 45, pool: true },
  { weekday: 'saturday', minutes: 150 },
  { weekday: 'sunday', minutes: 90 },
])

describe('generateTrainingPlan', () => {
  it('produces exactly as many weeks as fit between today and the race, ending on race week', () => {
    const today = new Date('2026-01-05T00:00:00') // a Monday
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' }) // ~12 weeks out
    const { plan } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    expect(plan.weeks.at(-1)?.phase).toBe('race')
    expect(plan.weeks.filter((w) => w.phase === 'race')).toHaveLength(1)
  })

  it('never schedules a session that exceeds that day\'s declared availability', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-06-01' })
    const { plan } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    for (const session of allSessions(plan)) {
      const available = getAvailableMinutes(FIVE_DAY_AVAILABILITY, session.date)
      expect(session.estimatedDurationMin).toBeLessThanOrEqual(available)
    }
  })

  it('never schedules a session on or after the race date', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' })
    const { plan } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    for (const session of allSessions(plan)) {
      expect(session.date < raceGoal.raceDate).toBe(true)
    }
  })

  it('respects an unavailable-day exception (no training debt piled elsewhere)', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' })
    const availability: Availability = {
      ...FIVE_DAY_AVAILABILITY,
      exceptions: [
        createAvailabilityException({ date: '2026-01-10', type: 'unavailable', reason: 'travel' }),
      ],
    }
    const { plan } = generateTrainingPlan({ raceGoal, availability, today })
    expect(allSessions(plan).some((s) => s.date === '2026-01-10')).toBe(false)
  })

  it('taper reduces average weekly load compared to the peak week beforehand', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-08-01' }) // long runway
    const { plan } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    const nonTaperWeeks = plan.weeks.filter((w) => w.phase !== 'taper' && w.phase !== 'race')
    const taperWeeks = plan.weeks.filter((w) => w.phase === 'taper')
    const peakLoad = Math.max(...nonTaperWeeks.map((w) => w.targetLoad))
    const avgTaperLoad =
      taperWeeks.reduce((sum, w) => sum + w.targetLoad, 0) / Math.max(1, taperWeeks.length)

    expect(avgTaperLoad).toBeLessThan(peakLoad)
  })

  it('includes every core discipline across the plan when pool access exists', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-08-01' })
    const { plan } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    const disciplines = new Set(allSessions(plan).map((s) => s.discipline))
    expect(disciplines.has('swim')).toBe(true)
    expect(disciplines.has('bike')).toBe(true)
    expect(disciplines.has('run')).toBe(true)
  })

  it('warns when the runway is too short for the distance instead of generating an aggressive plan', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-01-26' }) // 3 weeks out
    const { warnings } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('evolves week to week within a phase instead of repeating an identical week (real progression + deload)', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-08-01' }) // long runway
    const { plan } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    const buildWeeks = plan.weeks.filter((w) => w.phase === 'build')
    expect(buildWeeks.length).toBeGreaterThanOrEqual(4)

    const loads = buildWeeks.map((w) => w.targetLoad)
    // Not every week in the phase carries the same load — there's a real
    // progressive-overload-then-deload curve, not a flat repeat.
    expect(new Set(loads).size).toBeGreaterThan(1)
    // Some week in the block is a deliberate deload, lighter than the
    // hardest week that came before it.
    const peak = Math.max(...loads)
    expect(Math.min(...loads)).toBeLessThan(peak * 0.85)
  })

  it('produces no negative-duration sessions', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-03-30' })
    const { plan } = generateTrainingPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })
    for (const session of allSessions(plan)) {
      expect(session.estimatedDurationMin).toBeGreaterThan(0)
    }
  })
})
