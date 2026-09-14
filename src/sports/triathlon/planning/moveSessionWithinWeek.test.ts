import { describe, expect, it } from 'vitest'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createPlannedSession } from '@/core/training/PlannedSession'
import type { TrainingWeek } from '@/core/training/TrainingPlan'
import { findMoveCandidateDays, moveSessionToDay } from './moveSessionWithinWeek'

function session(overrides: Partial<Parameters<typeof createPlannedSession>[0]>) {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'endurance',
    title: 'Endurance vélo',
    objective: 'x',
    blocks: [],
    estimatedDurationMin: 70,
    priority: 'key',
    date: '2026-06-08', // a Monday
    weekId: 'week-1',
    ...overrides,
  })
}

function fullAvailability(pool = true): Availability {
  const pattern = createEmptyWeeklyPattern()
  const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
  for (const day of order) pattern[day] = { available: true, minutes: 90, poolAccess: pool }
  return { weeklyPattern: pattern, exceptions: [], restDays: [] }
}

function weekWith(sessions: ReturnType<typeof session>[]): TrainingWeek {
  return { id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 0, sessions }
}

describe('findMoveCandidateDays', () => {
  it('offers every other day of the week with enough time and no session yet', () => {
    const cancelled = session({ date: '2026-06-08' })
    const other = session({ date: '2026-06-10', discipline: 'run' })
    const week = weekWith([cancelled, other])

    const candidates = findMoveCandidateDays(cancelled, week, fullAvailability(), '2027-01-01')
    const candidateDates = candidates.map((c) => c.date)

    expect(candidateDates).not.toContain('2026-06-08') // the cancelled session's own day
    expect(candidateDates).not.toContain('2026-06-10') // already has a session
    expect(candidateDates).toContain('2026-06-09')
    expect(candidateDates).toContain('2026-06-14') // Sunday, still within the week
  })

  it('excludes days on or after the race', () => {
    const cancelled = session({ date: '2026-06-08' })
    const week = weekWith([cancelled])
    const candidates = findMoveCandidateDays(cancelled, week, fullAvailability(), '2026-06-10')
    expect(candidates.every((c) => c.date < '2026-06-10')).toBe(true)
  })

  it('excludes days without pool access for a swim session', () => {
    const cancelled = session({ date: '2026-06-08', discipline: 'swim', sessionType: 'endurance' })
    const week = weekWith([cancelled])
    const candidates = findMoveCandidateDays(cancelled, week, fullAvailability(false), '2027-01-01')
    expect(candidates).toHaveLength(0)
  })
})

describe('moveSessionToDay', () => {
  it('recreates the same discipline on the target date, sized to fit', () => {
    const cancelled = session({ date: '2026-06-08', discipline: 'bike' })
    const week = weekWith([cancelled])
    const moved = moveSessionToDay(cancelled, '2026-06-09', {
      phase: 'base',
      week,
      availability: fullAvailability(),
    })
    expect(moved).toBeDefined()
    expect(moved?.discipline).toBe('bike')
    expect(moved?.date).toBe('2026-06-09')
    expect(moved?.estimatedDurationMin).toBeLessThanOrEqual(90)
  })

  it('refuses to move a swim session to a day without pool access', () => {
    const cancelled = session({ date: '2026-06-08', discipline: 'swim', sessionType: 'endurance' })
    const week = weekWith([cancelled])
    const moved = moveSessionToDay(cancelled, '2026-06-09', {
      phase: 'base',
      week,
      availability: fullAvailability(false),
    })
    expect(moved).toBeUndefined()
  })

  it('uses the secondary (lighter) type when the discipline already appears elsewhere that week', () => {
    const cancelled = session({ date: '2026-06-08', discipline: 'bike' })
    const existingBike = session({ date: '2026-06-10', discipline: 'bike', sessionType: 'long' })
    const week = weekWith([cancelled, existingBike])
    const moved = moveSessionToDay(cancelled, '2026-06-09', {
      phase: 'base',
      week,
      availability: fullAvailability(),
    })
    // base phase: primary bike type is 'long', secondary is 'endurance'.
    expect(moved?.sessionType).toBe('endurance')
  })
})
