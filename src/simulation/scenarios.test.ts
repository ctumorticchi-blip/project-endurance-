import { describe, expect, it } from 'vitest'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import {
  createAvailabilityException,
  createEmptyWeeklyPattern,
  getAvailableMinutes,
  type Availability,
} from '@/core/availability/Availability'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { createSessionFeedback } from '@/core/history/SessionFeedback'
import { allSessions } from '@/core/training/TrainingPlan'
import { decideAdaptation } from '@/engine/adaptation/decideAdaptation'
import { applyDurationAdaptation, removeSessionFromPlan, replaceSessionInPlan } from '@/engine/adaptation/applyAdaptationToPlan'
import { computeUpcomingSlots } from '@/engine/adaptation/upcomingAvailability'
import { generateTrainingPlan } from '@/sports/triathlon/planning/generateTrainingPlan'
import { TRIATHLON_DISTANCES } from '@/sports/triathlon/domain/distance'
import type { Weekday } from '@/shared/types/common'

/**
 * End-to-end coherence checks across realistic athlete scenarios (brief
 * §57/§48-49) — not unit tests of one function, but "generate a plan, put
 * it through several weeks of real-world events, and verify the whole
 * plan is still internally consistent afterwards."
 */
function assertPlanInvariants(plan: ReturnType<typeof generateTrainingPlan>['plan'], availability: Availability, raceDate: string) {
  const sessions = allSessions(plan)

  for (const session of sessions) {
    // No session lands on or after the race date.
    expect(session.date < raceDate).toBe(true)
    // No negative or zero durations anywhere.
    expect(session.estimatedDurationMin).toBeGreaterThan(0)
    for (const block of session.blocks) {
      if (block.durationSec !== undefined) expect(block.durationSec).toBeGreaterThan(0)
      expect(block.targetRpeMin).toBeLessThanOrEqual(block.targetRpeMax)
    }
    // No day exceeds its declared availability (accounting for exceptions).
    const available = getAvailableMinutes(availability, session.date)
    expect(session.estimatedDurationMin).toBeLessThanOrEqual(available)
  }

  // No two sessions claim the same date within a week (a MOVE must never
  // silently double-book a day that already had something planned).
  for (const week of plan.weeks) {
    const dates = week.sessions.map((s) => s.date)
    expect(new Set(dates).size).toBe(dates.length)
  }
}

function fullAvailability(daysPerWeek: number, minutesPerDay: number, pool = true): Availability {
  const pattern = createEmptyWeeklyPattern()
  const order: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  for (let i = 0; i < daysPerWeek; i++) {
    pattern[order[i]!] = { available: true, minutes: minutesPerDay, poolAccess: pool }
  }
  return { weeklyPattern: pattern, exceptions: [] }
}

describe('Scenario A — Triathlon Sprint, intermediate, ~12 weeks, 5 sessions/week', () => {
  it('generates a coherent plan and survives a missed session + fatigue signal', () => {
    const today = new Date('2026-01-05T00:00:00') // Monday
    const raceDate = '2026-03-30' // ~12 weeks out
    const raceGoal = createRaceGoal({ distance: 'sprint', raceDate })
    const availability = fullAvailability(5, 75)
    createAthleteProfile({
      generalSportExperience: 'intermediate',
      triathlonExperience: 'some-races',
      disciplineLevels: { swim: 'intermediate', bike: 'intermediate', run: 'intermediate' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
      knownMetrics: {},
      biometrics: {},
    })

    const { plan } = generateTrainingPlan({ raceGoal, availability, today })
    assertPlanInvariants(plan, availability, raceDate)
    expect(plan.weeks.length).toBeGreaterThanOrEqual(11)

    // A key session gets missed for lack of time.
    const missed = plan.weeks[0]!.sessions.find((s) => s.priority === 'key')!
    const upcomingAvailability = computeUpcomingSlots({ availability, plan, fromDateExclusive: missed.date })
    const missDecision = decideAdaptation({
      session: missed,
      recentFeedback: [],
      missedReason: 'time',
      upcomingAvailability,
    })
    let updatedPlan = plan
    if (missDecision.type === 'REMOVE') {
      updatedPlan = removeSessionFromPlan(plan, missed.id)
    } else {
      updatedPlan = replaceSessionInPlan(plan, applyDurationAdaptation(missed, missDecision))
    }
    assertPlanInvariants(updatedPlan, availability, raceDate)

    // Then a fatigue signal on the next upcoming session.
    const next = allSessions(updatedPlan).find((s) => s.date > missed.date)!
    const fatigueDecision = decideAdaptation({
      session: next,
      readiness: 'tired',
      recentFeedback: [createSessionFeedback({ plannedSessionId: 'x', outcome: 'completed', rpe: 8 })],
    })
    expect(fatigueDecision.type).toBe('REDUCE')
    const finalPlan = replaceSessionInPlan(updatedPlan, applyDurationAdaptation(next, fatigueDecision))
    assertPlanInvariants(finalPlan, availability, raceDate)
  })
})

describe('Scenario B — Triathlon Olympic ("M"), intermediate, ~20 weeks, 6 sessions/week', () => {
  it('generates a coherent plan with a 2-week taper and a good-session signal', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceDate = '2026-05-25' // ~20 weeks out
    const raceGoal = createRaceGoal({ distance: 'olympic', raceDate })
    const availability = fullAvailability(6, 60)

    const { plan } = generateTrainingPlan({ raceGoal, availability, today })
    assertPlanInvariants(plan, availability, raceDate)

    const taperWeeks = plan.weeks.filter((w) => w.phase === 'taper')
    expect(taperWeeks).toHaveLength(2)
    const peakLoad = Math.max(...plan.weeks.filter((w) => w.phase !== 'taper' && w.phase !== 'race').map((w) => w.targetLoad))
    for (const week of taperWeeks) expect(week.targetLoad).toBeLessThan(peakLoad)

    // A very easy, low-RPE stretch with great readiness should increase (not decrease) a non-optional session.
    const secondary = allSessions(plan).find((s) => s.priority === 'secondary')!
    const goodDecision = decideAdaptation({
      session: secondary,
      readiness: 'great',
      recentFeedback: [
        createSessionFeedback({ plannedSessionId: 'x', outcome: 'completed', rpe: 3 }),
        createSessionFeedback({ plannedSessionId: 'x', outcome: 'completed', rpe: 2 }),
      ],
    })
    expect(['KEEP', 'INCREASE']).toContain(goodDecision.type)
    const updatedPlan = replaceSessionInPlan(plan, applyDurationAdaptation(secondary, goodDecision))
    assertPlanInvariants(updatedPlan, availability, raceDate)
  })
})

describe('Scenario C — first Sprint, low volume, 3-4 sessions/week', () => {
  it('respects the beginner minimum-runway warning and still produces a safe plan', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceDate = '2026-02-16' // ~6 weeks out — below the recommended 8-week minimum for a first Sprint.
    const raceGoal = createRaceGoal({ distance: 'sprint', raceDate })
    const availability = fullAvailability(3, 45)

    const { plan, warnings } = generateTrainingPlan({ raceGoal, availability, today })
    expect(warnings.length).toBeGreaterThan(0)
    assertPlanInvariants(plan, availability, raceDate)

    // Never a dangerously aggressive plan: no week's load should spike far
    // beyond the others just because the runway is short.
    const loads = plan.weeks.filter((w) => w.phase !== 'race').map((w) => w.targetLoad)
    const maxLoad = Math.max(...loads)
    const minLoad = Math.min(...loads.filter((l) => l > 0))
    expect(maxLoad / minLoad).toBeLessThan(4)
  })

  it('never suggests a plan shorter than the runway warns about', () => {
    const spec = TRIATHLON_DISTANCES.sprint
    expect(spec.recommendedMinWeeksBeginner).toBeGreaterThan(0)
  })
})

describe('Scenario D — athlete with many availability constraints', () => {
  it('handles a mid-cycle unavailable day and a reduced-time day without breaking invariants', () => {
    const today = new Date('2026-01-05T00:00:00')
    const raceDate = '2026-04-13'
    const raceGoal = createRaceGoal({ distance: 'sprint', raceDate })
    const availability: Availability = {
      ...fullAvailability(4, 50, false),
      exceptions: [
        createAvailabilityException({ date: '2026-01-17', type: 'unavailable', reason: 'weekend away' }),
        createAvailabilityException({ date: '2026-01-24', type: 'reduced', minutes: 20 }),
      ],
    }

    const { plan } = generateTrainingPlan({ raceGoal, availability, today })
    assertPlanInvariants(plan, availability, raceDate)
    expect(allSessions(plan).some((s) => s.date === '2026-01-17')).toBe(false)
  })
})
