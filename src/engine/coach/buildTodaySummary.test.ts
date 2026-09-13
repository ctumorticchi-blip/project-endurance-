import { describe, expect, it } from 'vitest'
import { createAvailabilityException, createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { generateTrainingPlan } from '@/sports/triathlon/planning/generateTrainingPlan'
import { buildTodaySummary } from './buildTodaySummary'

function availability(): Availability {
  const pattern = createEmptyWeeklyPattern()
  pattern.tuesday = { available: true, minutes: 60, poolAccess: true }
  pattern.saturday = { available: true, minutes: 120, poolAccess: false }
  pattern.sunday = { available: true, minutes: 90, poolAccess: false }
  return { weeklyPattern: pattern, exceptions: [] }
}

describe('buildTodaySummary', () => {
  it('describes the planned session and counts down to the race', () => {
    const today = new Date('2026-06-02T00:00:00') // Tuesday
    const raceGoal = createRaceGoal({ distance: 'sprint', raceDate: '2026-08-01' })
    const { plan } = generateTrainingPlan({ raceGoal, availability: availability(), today })

    const summary = buildTodaySummary({ plan, raceGoal, today: '2026-06-02' })

    expect(summary.session).toBeDefined()
    expect(summary.session?.date).toBe('2026-06-02')
    expect(summary.daysUntilRace).toBeGreaterThan(0)
    expect(summary.explanation.length).toBeGreaterThan(0)
  })

  it('explains a rest day instead of leaving it blank', () => {
    const today = new Date('2026-06-02T00:00:00')
    const raceGoal = createRaceGoal({ distance: 'sprint', raceDate: '2026-08-01' })
    const { plan } = generateTrainingPlan({ raceGoal, availability: availability(), today })

    // Monday has no session in this availability pattern (and falls within the plan's range).
    const summary = buildTodaySummary({ plan, raceGoal, today: '2026-06-08' })

    expect(summary.session).toBeUndefined()
    expect(summary.explanation).toContain('Repos')
  })

  it('mentions tomorrow\'s session when there is one', () => {
    const today = new Date('2026-06-02T00:00:00')
    const raceGoal = createRaceGoal({ distance: 'sprint', raceDate: '2026-08-01' })
    const { plan } = generateTrainingPlan({ raceGoal, availability: availability(), today })

    const summary = buildTodaySummary({ plan, raceGoal, today: '2026-06-06' }) // Saturday
    expect(summary.nextSession?.date).toBe('2026-06-07')
    expect(summary.explanation).toContain('Demain')
  })

  it('respects an unavailable-day exception when explaining a forced rest day', () => {
    const today = new Date('2026-06-02T00:00:00')
    const raceGoal = createRaceGoal({ distance: 'sprint', raceDate: '2026-08-01' })
    const withException: Availability = {
      ...availability(),
      exceptions: [createAvailabilityException({ date: '2026-06-02', type: 'unavailable' })],
    }
    const { plan } = generateTrainingPlan({ raceGoal, availability: withException, today })

    const summary = buildTodaySummary({ plan, raceGoal, today: '2026-06-02' })
    expect(summary.session).toBeUndefined()
  })
})
