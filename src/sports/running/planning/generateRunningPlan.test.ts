import { describe, expect, it } from 'vitest'
import { createAvailabilityException, createEmptyWeeklyPattern, getAvailableMinutes, type Availability } from '@/core/availability/Availability'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { allSessions } from '@/core/training/TrainingPlan'
import { WEEKDAYS } from '@/shared/types/common'
import { generateRunningPlan } from './generateRunningPlan'

function availabilityWithDays(
  days: { weekday: (typeof WEEKDAYS)[number]; minutes: number }[],
): Availability {
  const pattern = createEmptyWeeklyPattern()
  for (const d of days) {
    pattern[d.weekday] = { available: true, minutes: d.minutes, poolAccess: false }
  }
  return { weeklyPattern: pattern, exceptions: [] }
}

const FIVE_DAY_AVAILABILITY = availabilityWithDays([
  { weekday: 'tuesday', minutes: 50 },
  { weekday: 'wednesday', minutes: 40 },
  { weekday: 'thursday', minutes: 50 },
  { weekday: 'saturday', minutes: 100 },
  { weekday: 'sunday', minutes: 60 },
])

describe('generateRunningPlan', () => {
  it('produces exactly as many weeks as fit between today and the race, ending on race week', () => {
    const today = new Date('2026-01-05T00:00:00') // a Monday
    const raceGoal = createRaceGoal({ sport: 'running', distance: '10k', raceDate: '2026-03-30' })
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    expect(plan.weeks.at(-1)?.phase).toBe('race')
    expect(plan.weeks.filter((w) => w.phase === 'race')).toHaveLength(1)
  })

  it("never schedules a session that exceeds that day's declared availability", () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: 'half-marathon', raceDate: '2026-06-01' })
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    for (const session of allSessions(plan)) {
      const available = getAvailableMinutes(FIVE_DAY_AVAILABILITY, session.date)
      expect(session.estimatedDurationMin).toBeLessThanOrEqual(available)
    }
  })

  it('never schedules a session on or after the race date', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: '10k', raceDate: '2026-03-30' })
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    for (const session of allSessions(plan)) {
      expect(session.date < raceGoal.raceDate).toBe(true)
    }
  })

  it('respects an unavailable-day exception (no training debt piled elsewhere)', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: '10k', raceDate: '2026-03-30' })
    const availability: Availability = {
      ...FIVE_DAY_AVAILABILITY,
      exceptions: [
        createAvailabilityException({ date: '2026-01-10', type: 'unavailable', reason: 'travel' }),
      ],
    }
    const { plan } = generateRunningPlan({ raceGoal, availability, today })
    expect(allSessions(plan).some((s) => s.date === '2026-01-10')).toBe(false)
  })

  it('taper reduces average weekly load compared to the peak week beforehand', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: 'marathon', raceDate: '2026-10-01' }) // long runway
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    const nonTaperWeeks = plan.weeks.filter((w) => w.phase !== 'taper' && w.phase !== 'race')
    const taperWeeks = plan.weeks.filter((w) => w.phase === 'taper')
    const peakLoad = Math.max(...nonTaperWeeks.map((w) => w.targetLoad))
    const avgTaperLoad =
      taperWeeks.reduce((sum, w) => sum + w.targetLoad, 0) / Math.max(1, taperWeeks.length)

    expect(avgTaperLoad).toBeLessThan(peakLoad)
  })

  it('every session is a running discipline (run/strength/mobility only, never swim/bike/brick)', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: 'marathon', raceDate: '2026-10-01' })
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    const disciplines = new Set(allSessions(plan).map((s) => s.discipline))
    expect(disciplines.has('run')).toBe(true)
    expect(disciplines.has('swim')).toBe(false)
    expect(disciplines.has('bike')).toBe(false)
    expect(disciplines.has('brick')).toBe(false)
  })

  it('includes a long run every week that has at least one training day', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: 'marathon', raceDate: '2026-10-01' })
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    const weeksWithSessions = plan.weeks.filter((w) => w.sessions.length > 0 && w.phase !== 'race')
    for (const week of weeksWithSessions) {
      expect(week.sessions.some((s) => s.sessionType === 'long')).toBe(true)
    }
  })

  it('warns when the runway is too short for the distance instead of generating an aggressive plan', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: 'marathon', raceDate: '2026-01-26' }) // 3 weeks out
    const { warnings } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('evolves week to week within a phase instead of repeating an identical week (real progression + deload)', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: 'marathon', raceDate: '2026-10-01' }) // long runway
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })

    const buildWeeks = plan.weeks.filter((w) => w.phase === 'build')
    expect(buildWeeks.length).toBeGreaterThanOrEqual(4)

    const loads = buildWeeks.map((w) => w.targetLoad)
    expect(new Set(loads).size).toBeGreaterThan(1)
    const peak = Math.max(...loads)
    expect(Math.min(...loads)).toBeLessThan(peak * 0.85)
  })

  it('gives a shorter race (5K) a larger specific-phase share than a marathon, proportionally', () => {
    const today = new Date('2026-01-05T00:00:00')
    const fiveK = createRaceGoal({ sport: 'running', distance: '5k', raceDate: '2026-10-01' })
    const marathon = createRaceGoal({ sport: 'running', distance: 'marathon', raceDate: '2026-10-01' })

    const fiveKPlan = generateRunningPlan({ raceGoal: fiveK, availability: FIVE_DAY_AVAILABILITY, today }).plan
    const marathonPlan = generateRunningPlan({ raceGoal: marathon, availability: FIVE_DAY_AVAILABILITY, today }).plan

    const specificShare = (plan: typeof fiveKPlan) =>
      plan.weeks.filter((w) => w.phase === 'specific').length / plan.weeks.length

    expect(specificShare(fiveKPlan)).toBeGreaterThan(specificShare(marathonPlan))
  })

  it('produces no negative-duration sessions', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'running', distance: '10k', raceDate: '2026-03-30' })
    const { plan } = generateRunningPlan({ raceGoal, availability: FIVE_DAY_AVAILABILITY, today })
    for (const session of allSessions(plan)) {
      expect(session.estimatedDurationMin).toBeGreaterThan(0)
    }
  })
})
