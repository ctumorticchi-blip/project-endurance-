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

    it('an explicit rest day that is also marked unavailable produces exactly one rest day, not two', () => {
      // The exact reported scenario: Sunday unavailable in the weekly
      // pattern, and separately chosen as the explicit rest day. Before
      // `restDays` existed, an independently-requested rest-day *count*
      // could remove a second day on top of Sunday's own unavailability.
      const availability: Availability = {
        ...availabilityAllDays(90),
        weeklyPattern: {
          ...availabilityAllDays(90).weeklyPattern,
          sunday: { available: false, minutes: 0, poolAccess: false },
        },
        restDays: ['sunday'],
      }
      const sessions = build(availability)
      const scheduledDates = new Set(sessions.map((s) => s.date))
      // 2026-01-05 is a Monday, so this week's Sunday is 2026-01-11.
      expect(scheduledDates.has('2026-01-11')).toBe(false)
      expect(scheduledDates.size).toBe(6)
    })

    it('an explicit rest day is never scheduled even when it has plenty of declared minutes', () => {
      const availability: Availability = { ...availabilityAllDays(120), restDays: ['wednesday'] }
      const sessions = build(availability)
      expect(sessions.some((s) => s.date === '2026-01-07')).toBe(false)
    })
  })

  describe('progression across weeks of the same phase', () => {
    function buildAt(weekIndexInPhase: number, weeksInPhase = 8) {
      return buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'specific',
        weekIndexInPhase,
        weeksInPhase,
        weekId: `week-${weekIndexInPhase}`,
        availability: availabilityAllDays(120),
      })
    }

    it('gives the deload week (index 3 of the 4-week cycle) a lighter anchor session than the peak week before it', () => {
      const peakWeekBike = buildAt(2).find((s) => s.discipline === 'bike' && s.sessionType === 'threshold')
      const deloadWeekBike = buildAt(3).find((s) => s.discipline === 'bike' && s.sessionType === 'threshold')
      expect(peakWeekBike).toBeDefined()
      expect(deloadWeekBike).toBeDefined()
      expect(deloadWeekBike!.estimatedDurationMin).toBeLessThan(peakWeekBike!.estimatedDurationMin)
    })

    it('varies the anchor session structure between two standard-tier weeks (real diversification, not the identical session)', () => {
      // Weeks 0 and 1 are both 'standard' tier in the specific-phase cycle
      // (0.9 and 1.02 respectively land in different tiers... use base
      // instead, whose weeks 0/1 are both standard: 0.85 and 0.95).
      const weekA = buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'base',
        weekIndexInPhase: 0,
        weeksInPhase: 8,
        weekId: 'week-a',
        availability: availabilityAllDays(180),
      }).find((s) => s.discipline === 'bike' && s.sessionType === 'long')
      const weekB = buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'base',
        weekIndexInPhase: 1,
        weeksInPhase: 8,
        weekId: 'week-b',
        availability: availabilityAllDays(180),
      }).find((s) => s.discipline === 'bike' && s.sessionType === 'long')

      expect(weekA).toBeDefined()
      expect(weekB).toBeDefined()
      expect(weekA!.title).not.toBe(weekB!.title)
    })

    it('injects a long-endurance or VO2max secondary touch in build/specific instead of always the same grey-zone type', () => {
      const secondaryTypesAcrossCycle = new Set<string>()
      for (let i = 0; i < 4; i++) {
        const sessions = buildWeekSessions({
          weekStart: '2026-01-05',
          planEndDateExclusive: '2027-01-01',
          phase: 'build',
          weekIndexInPhase: i,
          weeksInPhase: 8,
          weekId: `week-${i}`,
          availability: availabilityAllDays(120),
        })
        const bikeSessions = sessions.filter((s) => s.discipline === 'bike')
        const secondary = bikeSessions.find((s) => s.priority !== 'key')
        if (secondary) secondaryTypesAcrossCycle.add(secondary.sessionType)
      }
      expect(secondaryTypesAcrossCycle.size).toBeGreaterThan(1)
    })
  })
})
