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

    it('injects a long-endurance secondary touch in build/specific instead of always the same grey-zone type', () => {
      // 180min/day so the rotation's 'long' entry (bike-long standard tier
      // is 150min) can actually fit and isn't itself degraded to
      // 'endurance' by duration alone — isolates genuine rotation
      // diversity from a duration-fallback artifact.
      const secondaryTypesAcrossCycle = new Set<string>()
      for (let i = 0; i < 4; i++) {
        const sessions = buildWeekSessions({
          weekStart: '2026-01-05',
          planEndDateExclusive: '2027-01-01',
          phase: 'build',
          weekIndexInPhase: i,
          weeksInPhase: 8,
          weekId: `week-${i}`,
          availability: availabilityAllDays(180),
          athleteProfile: TEST_ATHLETE_PROFILE,
        })
        const bikeSessions = sessions.filter((s) => s.discipline === 'bike')
        const secondary = bikeSessions.find((s) => s.priority !== 'key')
        if (secondary) secondaryTypesAcrossCycle.add(secondary.sessionType)
      }
      expect(secondaryTypesAcrossCycle.size).toBeGreaterThan(1)
    })

    // Training Intelligence V2.1 (brief §16, Week 8 audit): the build
    // cycle's toughest ('peak') week and the generic rotation's top-end
    // ('vo2max'/'intervals') entry both land on the cycle's 3rd week by
    // design — before this fix that meant a bike-neutral athlete's peak
    // week always compounded an already-harder Sweet Spot anchor with a
    // second, independently demanding VO2max touch. The engine must never
    // reproduce that stack, on any cycle length or availability.
    it('never stacks a VO2max secondary touch onto an already tier-bumped (peak) bike anchor', () => {
      for (let i = 0; i < 8; i++) {
        const sessions = buildWeekSessions({
          weekStart: '2026-01-05',
          planEndDateExclusive: '2027-01-01',
          phase: 'build',
          weekIndexInPhase: i,
          weeksInPhase: 8,
          weekId: `week-${i}`,
          availability: availabilityAllDays(180),
          athleteProfile: TEST_ATHLETE_PROFILE,
        })
        const anchor = sessions.find((s) => s.discipline === 'bike' && s.priority === 'key')
        const secondary = sessions.find((s) => s.discipline === 'bike' && s.priority !== 'key')
        if (anchor?.title.includes('semaine de pointe')) {
          expect(secondary?.sessionType).not.toBe('vo2max')
        }
      }
    })
  })

  describe('brick day assignment (Training Intelligence V2 — Gold Standard coaching review)', () => {
    /** Uneven-availability week shaped like the Gold Standard benchmark's:
     * one big day, three mid-sized days, two short days — the exact shape
     * that starved the brick slot down to a 30min transition drill every
     * time (see buildWeekSessions.ts's `dayAssignmentRank`). */
    function unevenAvailability(): Availability {
      const pattern = createEmptyWeeklyPattern()
      pattern.tuesday = { available: true, minutes: 60, poolAccess: true }
      pattern.wednesday = { available: true, minutes: 60, poolAccess: false }
      pattern.thursday = { available: true, minutes: 60, poolAccess: true }
      pattern.friday = { available: true, minutes: 45, poolAccess: false }
      pattern.saturday = { available: true, minutes: 90, poolAccess: false }
      pattern.sunday = { available: true, minutes: 45, poolAccess: false }
      return { weeklyPattern: pattern, exceptions: [], restDays: ['monday'] }
    }

    it('gives the brick slot a day with enough time for a real brick, not whatever is left over', () => {
      // weekIndexInPhase=1 is the only in-phase index `shouldInsertBrick`
      // fires on for a 3-week specific phase (odd index, brief-driven
      // "every other week" cadence) — matches the Gold Standard's week 12.
      const sessions = buildWeekSessions({
        weekStart: '2026-10-12',
        planEndDateExclusive: '2027-01-01',
        phase: 'specific',
        weekIndexInPhase: 1,
        weeksInPhase: 3,
        weekId: 'week-specific-2',
        availability: unevenAvailability(),
        athleteProfile: TEST_ATHLETE_PROFILE,
      })

      const brick = sessions.find((s) => s.discipline === 'brick')
      expect(brick).toBeDefined()
      // Before the fix this always degraded to the 30min transition-only
      // fallback because the brick slot was processed last, after both
      // bike touches and swim had already claimed every day with 60+
      // minutes — leaving only the week's two 45min days for it.
      expect(brick!.sessionType).not.toBe('transition')
      expect(brick!.estimatedDurationMin).toBeGreaterThanOrEqual(60)
    })

    it('still gives swim its pool day even though brick is now claimed earlier', () => {
      const sessions = buildWeekSessions({
        weekStart: '2026-10-12',
        planEndDateExclusive: '2027-01-01',
        phase: 'specific',
        weekIndexInPhase: 1,
        weeksInPhase: 3,
        weekId: 'week-specific-2',
        availability: unevenAvailability(),
        athleteProfile: TEST_ATHLETE_PROFILE,
      })

      const swim = sessions.find((s) => s.discipline === 'swim')
      expect(swim).toBeDefined()
      expect(['2026-10-13', '2026-10-15']).toContain(swim!.date) // Tuesday or Thursday — the only pool days
    })

    // Training Intelligence V2.1 (brief §21, brick-progression audit): the
    // mid-phase BRICK_SPECIFIC week and the final BRICK_RACE_REHEARSAL week
    // must produce genuinely different sessions even when the specific
    // phase's own load curve happens to put both weeks at 'peak' tier —
    // before the fix, both requests were promoted to whichever
    // 'race-specific' template fit the day at the week's *generic*
    // periodization tier, so they silently collapsed into the identical
    // 90min session on a realistic (90min biggest-day) week.
    it('gives BRICK_SPECIFIC and BRICK_RACE_REHEARSAL genuinely different sessions even on same-tier weeks', () => {
      const specificWeek = (weekIndexInPhase: number) =>
        buildWeekSessions({
          weekStart: '2026-10-12',
          planEndDateExclusive: '2027-01-01',
          phase: 'specific',
          weekIndexInPhase,
          weeksInPhase: 3,
          weekId: `week-specific-${weekIndexInPhase}`,
          availability: unevenAvailability(),
          athleteProfile: TEST_ATHLETE_PROFILE,
        })

      const midPhaseBrick = specificWeek(1).find((s) => s.discipline === 'brick') // BRICK_SPECIFIC
      const lastWeekBrick = specificWeek(2).find((s) => s.discipline === 'brick') // BRICK_RACE_REHEARSAL

      expect(midPhaseBrick).toBeDefined()
      expect(lastWeekBrick).toBeDefined()
      expect(lastWeekBrick!.title).not.toBe(midPhaseBrick!.title)
    })
  })

  describe('strength type selection (Training Intelligence V2 — Gold Standard coaching review)', () => {
    it('gives base/build a full strength stimulus, not the lightweight maintenance circuit every week', () => {
      // Before the fix, strength had no `preferredType` at all: an empty
      // type chain always fell through to "shortest template of the
      // discipline that fits", which a two-template catalog resolves to
      // the 20min `strength-maintenance` every single time, regardless of
      // phase or available time — brief §21's STRENGTH_FOUNDATION stimulus
      // was unreachable by the generator.
      const sessions = buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'build',
        weekIndexInPhase: 0, // load-building week, not the cycle's deload
        weeksInPhase: 4,
        weekId: 'week-build-0',
        availability: availabilityAllDays(60),
        athleteProfile: TEST_ATHLETE_PROFILE,
      })

      const strength = sessions.find((s) => s.discipline === 'strength')
      expect(strength).toBeDefined()
      expect(strength!.title).toBe('Renforcement général')
      expect(strength!.estimatedDurationMin).toBe(35)
    })

    it('always uses the lighter maintenance circuit in specific/taper to protect recovery for triathlon-specific work', () => {
      for (const phase of ['specific', 'taper'] as const) {
        const sessions = buildWeekSessions({
          weekStart: '2026-01-05',
          planEndDateExclusive: '2027-01-01',
          phase,
          weekIndexInPhase: 0,
          weeksInPhase: 4,
          weekId: `week-${phase}`,
          availability: availabilityAllDays(60),
          athleteProfile: TEST_ATHLETE_PROFILE,
        })

        const strength = sessions.find((s) => s.discipline === 'strength')
        expect(strength, `phase ${phase} has no strength session`).toBeDefined()
        expect(strength!.title, `phase ${phase}`).toBe("Renforcement d'entretien")
      }
    })

    // Training Intelligence V2.1 (brief §10/§26): strength is no longer
    // requested unconditionally wherever a day-slot happens to exist — it
    // must earn its place from the week's actual recovery budget, and race
    // week's budget is never available to it. Previously (V2) the fixed
    // `WEEKLY_SLOT_DISCIPLINES` table always reserved a strength slot at
    // 6+ training days regardless of phase, so even race week got one; the
    // dynamic composer's `generateWeeklySessionRequirements` explicitly
    // excludes strength from race week instead.
    it('never requests strength in race week, even with a full day-slot budget available', () => {
      const sessions = buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'race',
        weekIndexInPhase: 0,
        weeksInPhase: 4,
        weekId: 'week-race',
        availability: availabilityAllDays(60),
        athleteProfile: TEST_ATHLETE_PROFILE,
      })

      expect(sessions.some((s) => s.discipline === 'strength')).toBe(false)
    })
  })

  describe('the single "big day" a week is shared between competing long-type anchors (Training Intelligence V2.1 audit §19)', () => {
    /** Only one day is big enough for a genuine bike-long OR run-long
     * anchor (90min); every other day is too short for either. Forces the
     * two base-phase 'long' anchors to compete for the same day. */
    function oneBigDayAvailability(): Availability {
      const pattern = createEmptyWeeklyPattern()
      pattern.tuesday = { available: true, minutes: 60, poolAccess: true }
      pattern.wednesday = { available: true, minutes: 45, poolAccess: false }
      pattern.thursday = { available: true, minutes: 60, poolAccess: true }
      pattern.friday = { available: true, minutes: 45, poolAccess: false }
      pattern.saturday = { available: true, minutes: 90, poolAccess: false }
      pattern.sunday = { available: true, minutes: 45, poolAccess: false }
      return { weeklyPattern: pattern, exceptions: [], restDays: ['monday'] }
    }

    function athleteWith(limiterDiscipline: 'bike' | 'run', strongestDiscipline: 'bike' | 'run') {
      return createAthleteProfile({
        sport: 'triathlon',
        generalSportExperience: 'intermediate',
        triathlonExperience: 'some-races',
        disciplineLevels: {
          swim: 'intermediate',
          [limiterDiscipline]: 'beginner',
          [strongestDiscipline]: 'advanced',
        } as Record<'swim' | 'bike' | 'run', 'beginner' | 'intermediate' | 'advanced'>,
        equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
        knownMetrics: {},
        biometrics: {},
      })
    }

    /** Coaching defect found during the V2.1 audit: the old duration-only
     * tie-break in `claimDays` let the catalog's own median authored
     * duration per discipline decide who gets the week's only big-enough
     * day, regardless of which discipline the athlete actually needs to
     * develop — bike would always win over run purely because the bike-long
     * catalog's median duration happens to be larger, even for an athlete
     * whose limiter *is* run. The fix makes the tie-break consult the
     * athlete's own limiter analysis first, so the outcome genuinely flips
     * between two athletes with opposite limiters (success criterion #1),
     * instead of being an accident of catalog authoring. */
    it('gives the big day to the limiter discipline\'s long anchor, not whichever discipline the catalog happens to favor', () => {
      const runIsLimiter = buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'base',
        weekIndexInPhase: 0,
        weeksInPhase: 4,
        weekId: 'week-run-limiter',
        availability: oneBigDayAvailability(),
        athleteProfile: athleteWith('run', 'bike'),
      })
      const bikeIsLimiter = buildWeekSessions({
        weekStart: '2026-01-05',
        planEndDateExclusive: '2027-01-01',
        phase: 'base',
        weekIndexInPhase: 0,
        weeksInPhase: 4,
        weekId: 'week-bike-limiter',
        availability: oneBigDayAvailability(),
        athleteProfile: athleteWith('bike', 'run'),
      })

      const bigDay = '2026-01-10' // Saturday, the only 90min day
      const onBigDay = (sessions: ReturnType<typeof buildWeekSessions>) => sessions.find((s) => s.date === bigDay)

      expect(onBigDay(runIsLimiter)?.discipline).toBe('run')
      expect(onBigDay(bikeIsLimiter)?.discipline).toBe('bike')
    })
  })
})
