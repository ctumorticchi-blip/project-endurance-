import { describe, expect, it } from 'vitest'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { createTrainingPlan } from '@/core/training/TrainingPlan'
import { computeUpcomingSlots } from './upcomingAvailability'

function availability(): Availability {
  const pattern = createEmptyWeeklyPattern()
  pattern.tuesday = { available: true, minutes: 60, poolAccess: false }
  pattern.wednesday = { available: true, minutes: 90, poolAccess: false }
  pattern.thursday = { available: true, minutes: 10, poolAccess: false } // too short to count
  return { weeklyPattern: pattern, exceptions: [] }
}

describe('computeUpcomingSlots', () => {
  it('lists only days with enough free minutes, earliest first', () => {
    // 2026-06-01 is a Monday.
    const plan = createTrainingPlan({ raceGoalId: 'g', warnings: [], weeks: [] })
    const slots = computeUpcomingSlots({ availability: availability(), plan, fromDateExclusive: '2026-06-01' })
    expect(slots.map((s) => s.date)).toEqual(['2026-06-02', '2026-06-03'])
  })

  it('skips a day that already has a session planned', () => {
    const occupied = createPlannedSession({
      discipline: 'run',
      sessionType: 'endurance',
      title: 'x',
      objective: 'x',
      blocks: [],
      estimatedDurationMin: 30,
      priority: 'secondary',
      date: '2026-06-02',
      weekId: 'week-1',
    })
    const plan = createTrainingPlan({
      raceGoalId: 'g',
      warnings: [],
      weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-01', phase: 'base', targetLoad: 20, sessions: [occupied] }],
    })
    const slots = computeUpcomingSlots({ availability: availability(), plan, fromDateExclusive: '2026-06-01' })
    expect(slots.map((s) => s.date)).toEqual(['2026-06-03'])
  })
})
