import { describe, expect, it } from 'vitest'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { buildWeekSessions } from './buildWeekSessions'

/** A balanced intermediate triathlete — keeps every test in this file on
 * the pre-Training-Intelligence-V2 generic rotation (no limiter/strongest
 * bias), so existing assertions about the rotation's own behavior stay
 * meaningful. Limiter-specific behavior is covered in
 * `sports/triathlon/coaching/weeklyStimulusComposer.test.ts`. */
const TEST_ATHLETE_PROFILE = createAthleteProfile({
  sport: 'triathlon',
  generalSportExperience: 'intermediate',
  triathlonExperience: 'some-races',
  disciplineLevels: { swim: 'intermediate', bike: 'intermediate', run: 'intermediate' },
  equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
  knownMetrics: {},
  biometrics: {},
})

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
      athleteProfile: TEST_ATHLETE_PROFILE,
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
      athleteProfile: TEST_ATHLETE_PROFILE,
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
        athleteProfile: TEST_ATHLETE_PROFILE,
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

    it('schedules every non-rest day even when pool access forces the swim slot to skip ahead', () => {
      // Regression: when the day naturally in line for the swim slot has no
      // pool access, the swim slot grabs a *different* day out of order.
      // That day used to just vanish from the schedule instead of freeing
      // its own slot back up — leaving one extra, unrequested day empty
      // even though only one rest day (Sunday) was ever asked for.
      const pattern = availabilityAllDays(90).weeklyPattern
      const availability: Availability = {
        weeklyPattern: {
          ...pattern,
          monday: { available: true, minutes: 120, poolAccess: false },
          tuesday: { available: true, minutes: 110, poolAccess: false },
          wednesday: { available: true, minutes: 100, poolAccess: false },
          thursday: { available: true, minutes: 95, poolAccess: true },
          friday: { available: true, minutes: 90, poolAccess: false },
          saturday: { available: true, minutes: 85, poolAccess: false },
          sunday: { available: false, minutes: 0, poolAccess: false },
        },
        exceptions: [],
        restDays: ['sunday'],
      }
      const sessions = build(availability)
      const scheduledDates = new Set(sessions.map((s) => s.date))
      // 2026-01-05 is a Monday, so this week's Sunday is 2026-01-11.
      expect(scheduledDates.has('2026-01-11')).toBe(false)
      expect(scheduledDates.size).toBe(6)
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
        athleteProfile: TEST_ATHLETE_PROFILE,
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
        athleteProfile: TEST_ATHLETE_PROFILE,
      }).find((s) => s.discipline === 'bike' && s.sessionType === 'long')
      const weekB = buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'base',
        weekIndexInPhase: 1,
        weeksInPhase: 8,
        weekId: 'week-b',
        availability: availabilityAllDays(180),
        athleteProfile: TEST_ATHLETE_PROFILE,
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
          athleteProfile: TEST_ATHLETE_PROFILE,
        })
        const bikeSessions = sessions.filter((s) => s.discipline === 'bike')
        const secondary = bikeSessions.find((s) => s.priority !== 'key')
        if (secondary) secondaryTypesAcrossCycle.add(secondary.sessionType)
      }
      expect(secondaryTypesAcrossCycle.size).toBeGreaterThan(1)
    })
  })
})
