import { describe, expect, it } from 'vitest'
import { createAthleteProfile, type AthleteProfile } from '@/core/athlete/AthleteProfile'
import {
  createAvailabilityException,
  createEmptyWeeklyPattern,
  type Availability,
} from '@/core/availability/Availability'
import { createInitialProgressionState, appendProgressionExposure } from '@/core/coaching/progressionState'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { createSessionFeedback } from '@/core/history/SessionFeedback'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { allSessions } from '@/core/training/TrainingPlan'
import { decideAdaptation } from '@/engine/adaptation/decideAdaptation'
import { detectAvailabilityGap } from '@/engine/history/detectAvailabilityGap'
import { decideProgressionResponse } from '@/engine/progression/decideProgressionResponse'
import { analyzeLimiters } from '@/sports/triathlon/coaching/limiterAnalysis'
import { generateTrainingPlan } from '@/sports/triathlon/planning/generateTrainingPlan'
import { WEEKDAYS } from '@/shared/types/common'

/**
 * Training Intelligence V2's benchmark matrix (brief §35) — 15 named
 * athlete/scenario combinations, each translating one realistic coaching
 * situation into a handful of deterministic assertions. Not a repeat of
 * `goldStandard.test.ts`'s exhaustive manual-review-grade coverage (that
 * stays the one plan reviewed session-by-session) — each entry here checks
 * only the specific claim the scenario exists to prove, per brief §47:
 * quality of the underlying decision, not exhaustiveness of the suite.
 * Entry 03 *is* the Gold Standard athlete; it isn't duplicated here.
 */

function availabilityWithDays(
  days: { weekday: (typeof WEEKDAYS)[number]; minutes: number; pool?: boolean }[],
  restDays: (typeof WEEKDAYS)[number][] = [],
): Availability {
  const pattern = createEmptyWeeklyPattern()
  for (const d of days) {
    pattern[d.weekday] = { available: true, minutes: d.minutes, poolAccess: d.pool ?? false }
  }
  return { weeklyPattern: pattern, exceptions: [], restDays }
}

function athlete(overrides: Partial<Parameters<typeof createAthleteProfile>[0]> = {}): AthleteProfile {
  return createAthleteProfile({
    sport: 'triathlon',
    generalSportExperience: 'intermediate',
    triathlonExperience: 'some-races',
    disciplineLevels: { swim: 'intermediate', bike: 'intermediate', run: 'intermediate' },
    equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
    knownMetrics: {},
    biometrics: {},
    ...overrides,
  })
}

describe('Benchmark matrix (Training Intelligence V2, brief §35)', () => {
  it('01 — Sprint, beginner, 3h/week: conservative, non-agressive progression on a short weekly budget', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-04-06' }) // ~13 weeks
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 45, pool: true },
      { weekday: 'thursday', minutes: 45 },
      { weekday: 'saturday', minutes: 90 },
    ])
    const beginner = athlete({
      generalSportExperience: 'beginner',
      triathlonExperience: 'first-triathlon',
      disciplineLevels: { swim: 'beginner', bike: 'beginner', run: 'beginner' },
    })
    const { plan } = generateTrainingPlan({ raceGoal, availability, athleteProfile: beginner, today })

    for (const session of allSessions(plan)) {
      expect(session.estimatedDurationMin).toBeLessThanOrEqual(90)
    }
    // 3 declared days: never invents a training day the athlete didn't give it.
    for (const week of plan.weeks) {
      const daysUsed = new Set(week.sessions.map((s) => s.date))
      expect(daysUsed.size).toBeLessThanOrEqual(3)
    }
  })

  it('02 — Sprint, intermediate, 5h/week: a real intensity progression across the block (not the beginner plan scaled up)', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'sprint', raceDate: '2026-05-04' })
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: true },
      { weekday: 'wednesday', minutes: 60 },
      { weekday: 'thursday', minutes: 60, pool: true },
      { weekday: 'saturday', minutes: 90 },
      { weekday: 'sunday', minutes: 60 },
    ])
    const { plan } = generateTrainingPlan({ raceGoal, availability, athleteProfile: athlete(), today })

    const runTypes = new Set(allSessions(plan).filter((s) => s.discipline === 'run').map((s) => s.sessionType))
    expect(runTypes.has('tempo') || runTypes.has('threshold')).toBe(true) // real intensity, not just endurance forever
  })

  it('04 — strong runner, weak swimmer: run maintained economically while swim gets development focus', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-06-01' })
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: true },
      { weekday: 'wednesday', minutes: 60 },
      { weekday: 'thursday', minutes: 60, pool: true },
      { weekday: 'friday', minutes: 45 },
      { weekday: 'saturday', minutes: 90 },
      { weekday: 'sunday', minutes: 45 },
    ])
    const profile = athlete({ disciplineLevels: { swim: 'beginner', bike: 'intermediate', run: 'advanced' } })
    const limiterAnalysis = analyzeLimiters(profile)
    expect(limiterAnalysis.limiter).toBe('swim')
    expect(limiterAnalysis.strongest).toBe('run')

    const { plan } = generateTrainingPlan({ raceGoal, availability, athleteProfile: profile, today })
    const swimCount = allSessions(plan).filter((s) => s.discipline === 'swim').length
    const runCount = allSessions(plan).filter((s) => s.discipline === 'run').length
    // Swim (the limiter) trains more often across the plan than run (the
    // strongest) despite run being the "bigger" discipline by reputation.
    expect(swimCount).toBeGreaterThan(runCount)
  })

  it('05 — strong cyclist, weak runner: bike maintained, run gets the development bias', () => {
    const profile = athlete({ disciplineLevels: { swim: 'intermediate', bike: 'advanced', run: 'beginner' } })
    const limiterAnalysis = analyzeLimiters(profile)
    expect(limiterAnalysis.limiter).toBe('run')
    expect(limiterAnalysis.strongest).toBe('bike')
    expect(limiterAnalysis.explanation.toLowerCase()).toContain('course') // French "run" — names the actual limiter, not a generic message
  })

  it('06 — only 4 training days: every key stimulus (swim/bike/run) still represented, nothing silently dropped', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-06-15' })
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: true },
      { weekday: 'thursday', minutes: 60 },
      { weekday: 'saturday', minutes: 120 },
      { weekday: 'sunday', minutes: 90 },
    ])
    const { plan } = generateTrainingPlan({ raceGoal, availability, athleteProfile: athlete(), today })
    const disciplines = new Set(allSessions(plan).map((s) => s.discipline))
    expect(disciplines.has('swim')).toBe(true)
    expect(disciplines.has('bike')).toBe(true)
    expect(disciplines.has('run')).toBe(true)
    for (const week of plan.weeks) {
      const daysUsed = new Set(week.sessions.map((s) => s.date))
      expect(daysUsed.size).toBeLessThanOrEqual(4)
    }
  })

  it('07 — swim only possible on 2 specific days: every swim session lands on one of those two days, never elsewhere', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-06-15' })
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: true },
      { weekday: 'wednesday', minutes: 60, pool: false },
      { weekday: 'friday', minutes: 60, pool: true },
      { weekday: 'saturday', minutes: 120, pool: false },
      { weekday: 'sunday', minutes: 90, pool: false },
    ])
    const { plan } = generateTrainingPlan({ raceGoal, availability, athleteProfile: athlete(), today })
    for (const session of allSessions(plan).filter((s) => s.discipline === 'swim')) {
      const weekday = WEEKDAYS[(new Date(session.date).getDay() + 6) % 7]
      expect(['tuesday', 'friday']).toContain(weekday)
    }
  })

  it('08 — starting 6 weeks before race: short runway produces a real (if compressed) plan, with a beginner-runway warning when the athlete is not experienced', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-02-16' }) // ~6 weeks
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: true },
      { weekday: 'thursday', minutes: 60, pool: true },
      { weekday: 'saturday', minutes: 90 },
      { weekday: 'sunday', minutes: 60 },
    ])
    const beginner = athlete({ generalSportExperience: 'beginner', triathlonExperience: 'first-triathlon' })
    const { plan, warnings } = generateTrainingPlan({ raceGoal, availability, athleteProfile: beginner, today })

    expect(plan.weeks.length).toBeLessThanOrEqual(7)
    expect(plan.weeks.at(-1)?.phase).toBe('race')
    expect(warnings.length).toBeGreaterThan(0) // brief §16: short runway must surface a notice, not silently attempt a normal progression
  })

  it('09 — starting 20+ weeks before race: long runway gets real periodization, not one extended base phase', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-06-08' }) // ~22 weeks
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: true },
      { weekday: 'wednesday', minutes: 60 },
      { weekday: 'thursday', minutes: 60, pool: true },
      { weekday: 'saturday', minutes: 120 },
      { weekday: 'sunday', minutes: 90 },
    ])
    const { plan, warnings } = generateTrainingPlan({ raceGoal, availability, athleteProfile: athlete(), today })

    expect(warnings).toHaveLength(0)
    const phasesPresent = new Set(plan.weeks.map((w) => w.phase))
    expect(phasesPresent).toEqual(new Set(['base', 'build', 'specific', 'taper', 'race']))
    // A long runway should not collapse into one giant base block: base
    // must not be the majority of the entire plan.
    const baseWeeks = plan.weeks.filter((w) => w.phase === 'base').length
    expect(baseWeeks).toBeLessThan(plan.weeks.length / 2)
  })

  it('10 — repeatedly completing 4 of 6 declared weekly sessions: the engine names a real, evidence-based capacity gap, not a one-week overreaction', () => {
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: true },
      { weekday: 'wednesday', minutes: 60 },
      { weekday: 'thursday', minutes: 60, pool: true },
      { weekday: 'friday', minutes: 45 },
      { weekday: 'saturday', minutes: 90 },
      { weekday: 'sunday', minutes: 45 },
    ])
    // 4 completed, 2 missed, repeated twice — a consistent pattern, not a single bad week.
    const feedback = Array.from({ length: 12 }, (_, i) =>
      createSessionFeedback({
        plannedSessionId: `session-${i}`,
        outcome: i % 3 === 2 ? 'missed' : 'completed',
        rpe: 5,
        perceivedDifficulty: 'as-expected',
      }),
    )

    const gap = detectAvailabilityGap(availability, feedback)
    expect(gap.hasGap).toBe(true)
    expect(gap.suggestedSessionsPerWeek).toBeLessThan(gap.declaredSessionsPerWeek)
    expect(gap.suggestion).toBeTruthy()
    expect(gap.suggestion?.toLowerCase()).not.toMatch(/échec|faute/) // never framed as the athlete's failure
  })

  it('11 — persistently high RPE: the adaptation engine reduces load from the trend, not from a single hard session', () => {
    const session = createPlannedSession({
      discipline: 'run',
      sessionType: 'threshold',
      title: 'Séance seuil',
      objective: 'Test',
      blocks: [],
      estimatedDurationMin: 60,
      priority: 'key',
      date: '2026-03-10',
      weekId: 'week-x',
    })
    const highRpeHistory = Array.from({ length: 4 }, () =>
      createSessionFeedback({ plannedSessionId: 'other', outcome: 'completed', rpe: 9, perceivedDifficulty: 'harder-than-expected' }),
    )
    const result = decideAdaptation({ session, recentFeedback: highRpeHistory })
    expect(result.type).toBe('REDUCE')
    expect(result.reasons).toContain('HIGH_RECENT_RPE')
    expect(result.after.estimatedDurationMin).toBeLessThan(result.before.estimatedDurationMin)
  })

  it('12 — progressing faster than expected: a single easy exposure bumps the ladder, and sustained easy evidence goes further and flags the zone itself as stale', () => {
    let state = createInitialProgressionState('BIKE_THRESHOLD_INTERVALS', 2)
    state = appendProgressionExposure(state, {
      date: '2026-03-10',
      level: state.currentLevel,
      outcome: 'completed',
      targetRpe: 7,
      actualRpe: 5, // comfortably easier than prescribed
    })
    const afterOne = decideProgressionResponse({ state, maxLevel: 6, recentOverallFatigueElevated: false })
    expect(afterOne.decision).toBe('PROGRESS')
    expect(afterOne.nextLevel).toBeGreaterThan(2)

    // Two more exposures, same margin, same direction — not just "bump the
    // level again", but recognize the underlying zone itself is now stale
    // and needs retesting (brief §27: repeated evidence of a systematically
    // wrong target, never from one exceptional session).
    for (let i = 0; i < 2; i++) {
      state = appendProgressionExposure(state, {
        date: `2026-03-${11 + i}`,
        level: state.currentLevel,
        outcome: 'completed',
        targetRpe: 7,
        actualRpe: 5,
      })
    }
    const finalResponse = decideProgressionResponse({ state, maxLevel: 6, recentOverallFatigueElevated: false })
    expect(finalResponse.decision).toBe('RECALIBRATE')
    expect(finalResponse.reasonCodes).toContain('ZONE_RECALIBRATION_REQUIRED')
    expect(finalResponse.explanation.toLowerCase()).toContain('test')
  })

  it('13 — travel-constrained week (short availability exception): the disrupted session is protected or shortened, never silently dropped without a decision', () => {
    const session = createPlannedSession({
      discipline: 'bike',
      sessionType: 'endurance',
      title: 'Sortie vélo',
      objective: 'Test',
      blocks: [],
      estimatedDurationMin: 90,
      priority: 'key',
      date: '2026-03-10',
      weekId: 'week-x',
    })
    const exception = createAvailabilityException({ date: '2026-03-10', type: 'reduced', minutes: 20 })
    expect(exception.minutes).toBe(20)

    const result = decideAdaptation({
      session,
      recentFeedback: [],
      missedReason: 'time',
      upcomingAvailability: [{ date: '2026-03-11', minutes: 30 }],
    })
    // Not enough of a slot to move it whole, and it's a key session: it
    // must be protected as a shorter version, not just deleted.
    expect(result.type).toBe('REPLACE')
    expect(result.after.estimatedDurationMin).toBeGreaterThan(0)
  })

  it('14 — pool unavailable week: swim time is reallocated to bike/run rather than wasted', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceGoal = createRaceGoal({ sport: 'triathlon', distance: 'olympic', raceDate: '2026-06-15' })
    // No pool access at all this week.
    const availability = availabilityWithDays([
      { weekday: 'tuesday', minutes: 60, pool: false },
      { weekday: 'wednesday', minutes: 60, pool: false },
      { weekday: 'thursday', minutes: 60, pool: false },
      { weekday: 'saturday', minutes: 120, pool: false },
      { weekday: 'sunday', minutes: 90, pool: false },
    ])
    const { plan } = generateTrainingPlan({ raceGoal, availability, athleteProfile: athlete(), today })
    const swimCount = allSessions(plan).filter((s) => s.discipline === 'swim').length
    expect(swimCount).toBe(0) // no pool access anywhere: no swim session invented from nothing
    // The day that would have gone to swim was donated to bike/run, not lost.
    for (const week of plan.weeks.slice(1, -1)) {
      const daysUsed = new Set(week.sessions.map((s) => s.date))
      expect(daysUsed.size).toBeGreaterThanOrEqual(4) // still uses (most of) its 5 declared days
    }
  })

  it('15 — race-week disruption: readiness/RPE-driven adaptation is suppressed during race week (taper protection)', () => {
    const session = createPlannedSession({
      discipline: 'run',
      sessionType: 'tempo',
      title: 'Séance course pré-course',
      objective: 'Test',
      blocks: [],
      estimatedDurationMin: 30,
      priority: 'key',
      date: '2026-03-10',
      weekId: 'week-race',
    })
    const result = decideAdaptation({
      session,
      readiness: 'tired',
      recentFeedback: [
        createSessionFeedback({ plannedSessionId: 'x', outcome: 'completed', rpe: 9, perceivedDifficulty: 'harder-than-expected' }),
      ],
      isRaceWeek: true,
    })
    expect(result.type).toBe('KEEP')
    expect(result.reasons).toEqual(['TAPER_PROTECTION'])
  })
})
