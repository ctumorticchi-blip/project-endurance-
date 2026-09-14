import { describe, expect, it } from 'vitest'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { buildWeekSessions } from './buildWeekSessions'

function availabilityAllDays(minutes: number): Availability {
  const pattern = createEmptyWeeklyPattern()
  for (const day of Object.keys(pattern) as (keyof typeof pattern)[]) {
    pattern[day] = { available: true, minutes, poolAccess: true }
  }
  return { weeklyPattern: pattern, exceptions: [] }
}

describe('buildWeekSessions', () => {
  it('never labels a session "key" when time constraints degraded it to a recovery session', () => {
    // Only 60 min/day: base phase's "long" anchor sessions (150/75 min) can
    // never fit, so every key slot degrades to recovery — it must not keep
    // the "key" label, or the Today screen's narrative would contradict
    // the session it actually shows.
    const sessions = buildWeekSessions({
      weekStart: '2026-01-05',
      planEndDateExclusive: '2027-01-01',
      phase: 'base',
      weekIndexInPhase: 0,
      weekId: 'week-1',
      availability: availabilityAllDays(60),
    })

    for (const session of sessions) {
      if (session.sessionType === 'recovery') {
        expect(session.priority).not.toBe('key')
      }
    }
  })

  it('keeps the key label when the anchor session actually fits', () => {
    const sessions = buildWeekSessions({
      weekStart: '2026-01-05',
      planEndDateExclusive: '2027-01-01',
      phase: 'base',
      weekIndexInPhase: 0,
      weekId: 'week-1',
      availability: availabilityAllDays(180),
    })

    const longBike = sessions.find((s) => s.discipline === 'bike' && s.sessionType === 'long')
    expect(longBike?.priority).toBe('key')
  })

  describe('rest days', () => {
    function build(availability: Availability) {
      return buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'base',
        weekIndexInPhase: 0,
        weekId: 'week-1',
        availability,
      })
    }

    it('never schedules all 7 days even when every day is marked available', () => {
      const sessions = build(availabilityAllDays(90))
      const scheduledDates = new Set(sessions.map((s) => s.date))
      expect(scheduledDates.size).toBeLessThanOrEqual(6)
    })

    it('still reserves at least one rest day when the athlete asks for zero', () => {
      const availability = { ...availabilityAllDays(90), desiredRestDaysPerWeek: 0 }
      const sessions = build(availability)
      const scheduledDates = new Set(sessions.map((s) => s.date))
      expect(scheduledDates.size).toBeLessThanOrEqual(6)
    })

    it('reserves more rest days when the athlete asks for more', () => {
      const availability = { ...availabilityAllDays(90), desiredRestDaysPerWeek: 3 }
      const sessions = build(availability)
      const scheduledDates = new Set(sessions.map((s) => s.date))
      expect(scheduledDates.size).toBeLessThanOrEqual(4)
    })
  })
})
