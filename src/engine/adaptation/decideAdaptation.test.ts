import { describe, expect, it } from 'vitest'
import { createSessionFeedback, type SessionFeedback } from '@/core/history/SessionFeedback'
import { createPlannedSession, type PlannedSession, type SessionPriority } from '@/core/training/PlannedSession'
import { applyDurationAdaptation } from './applyAdaptationToPlan'
import { decideAdaptation, decideAvailabilityConstraint } from './decideAdaptation'

function session(priority: SessionPriority = 'key', estimatedDurationMin = 60): PlannedSession {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'sweet-spot',
    title: 'Test session',
    objective: 'Test',
    blocks: [],
    estimatedDurationMin,
    priority,
    date: '2026-06-10',
    weekId: 'week-1',
  })
}

function feedbackWithRpe(rpe: number): SessionFeedback {
  return createSessionFeedback({
    plannedSessionId: 'other-session',
    outcome: 'completed',
    rpe,
    perceivedDifficulty: 'as-expected',
  })
}

describe('decideAdaptation — upcoming session (readiness/RPE driven)', () => {
  it('KEEPs the session when there is no meaningful signal', () => {
    const result = decideAdaptation({ session: session(), recentFeedback: [] })
    expect(result.type).toBe('KEEP')
    expect(result.after).toEqual(result.before)
  })

  it('REDUCEs a non-key session more aggressively than a key one when tired', () => {
    const keyResult = decideAdaptation({ session: session('key', 60), readiness: 'tired', recentFeedback: [] })
    const secondaryResult = decideAdaptation({
      session: session('secondary', 60),
      readiness: 'tired',
      recentFeedback: [],
    })

    expect(keyResult.type).toBe('REDUCE')
    expect(keyResult.reasons).toContain('ELEVATED_FATIGUE')
    expect(keyResult.after.estimatedDurationMin).toBeLessThan(keyResult.before.estimatedDurationMin)

    expect(secondaryResult.after.estimatedDurationMin).toBeLessThan(keyResult.after.estimatedDurationMin)
  })

  it('does not REDUCE from a single high-RPE data point, only from a trend', () => {
    const singlePoint = decideAdaptation({ session: session(), recentFeedback: [feedbackWithRpe(9)] })
    expect(singlePoint.type).toBe('KEEP')

    const trend = decideAdaptation({
      session: session(),
      recentFeedback: [feedbackWithRpe(9), feedbackWithRpe(8)],
    })
    expect(trend.type).toBe('REDUCE')
    expect(trend.reasons).toContain('HIGH_RECENT_RPE')
  })

  it('INCREASEs a non-optional session when readiness is great and recent RPE is low', () => {
    const result = decideAdaptation({
      session: session('secondary'),
      readiness: 'great',
      recentFeedback: [feedbackWithRpe(3), feedbackWithRpe(2)],
    })
    expect(result.type).toBe('INCREASE')
    expect(result.after.estimatedDurationMin).toBeGreaterThan(result.before.estimatedDurationMin)
  })

  it('never INCREASEs an optional session even with strong positive signals', () => {
    const result = decideAdaptation({
      session: session('optional'),
      readiness: 'great',
      recentFeedback: [feedbackWithRpe(2), feedbackWithRpe(3)],
    })
    expect(result.type).not.toBe('INCREASE')
  })

  it('tired readiness overrides a low-RPE trend rather than increasing load', () => {
    const result = decideAdaptation({
      session: session(),
      readiness: 'tired',
      recentFeedback: [feedbackWithRpe(2), feedbackWithRpe(3)],
    })
    expect(result.type).toBe('REDUCE')
  })

  it('does not compound across repeated check-ins on the same session (tired → normal → tired)', () => {
    const first = decideAdaptation({ session: session('key', 60), readiness: 'tired', recentFeedback: [] })
    const afterFirst = applyDurationAdaptation(session('key', 60), first)
    expect(afterFirst.estimatedDurationMin).toBeLessThan(60)

    // "Normal" has no signal, so it should restore the original plan.
    const second = decideAdaptation({ session: afterFirst, readiness: 'normal', recentFeedback: [] })
    const afterSecond = applyDurationAdaptation(afterFirst, second)
    expect(afterSecond.estimatedDurationMin).toBe(60)

    // Checking "tired" again from the restored session must land on the
    // exact same reduced duration as the very first tired check-in —
    // never smaller.
    const third = decideAdaptation({ session: afterSecond, readiness: 'tired', recentFeedback: [] })
    expect(third.after.estimatedDurationMin).toBe(first.after.estimatedDurationMin)
  })

  it('protects race week from readiness/RPE-driven adaptation (brief §26)', () => {
    const tiredDuringRaceWeek = decideAdaptation({
      session: session('key', 60),
      readiness: 'tired',
      recentFeedback: [],
      isRaceWeek: true,
    })
    expect(tiredDuringRaceWeek.type).toBe('KEEP')
    expect(tiredDuringRaceWeek.reasons).toEqual(['TAPER_PROTECTION'])

    const highRpeDuringRaceWeek = decideAdaptation({
      session: session('key', 60),
      recentFeedback: [feedbackWithRpe(9), feedbackWithRpe(9)],
      isRaceWeek: true,
    })
    expect(highRpeDuringRaceWeek.type).toBe('KEEP')
    expect(highRpeDuringRaceWeek.reasons).toEqual(['TAPER_PROTECTION'])
  })

  it('does not protect a normal (non-race) week — readiness/RPE adaptation still applies', () => {
    const result = decideAdaptation({
      session: session('key', 60),
      readiness: 'tired',
      recentFeedback: [],
      isRaceWeek: false,
    })
    expect(result.type).toBe('REDUCE')
  })
})

describe('decideAdaptation — missed session', () => {
  it('REMOVEs on pain and recommends professional advice without diagnosing', () => {
    const result = decideAdaptation({ session: session('key'), recentFeedback: [], missedReason: 'pain' })
    expect(result.type).toBe('REMOVE')
    expect(result.reasons).toContain('PAIN_REPORTED')
    expect(result.explanation.toLowerCase()).not.toMatch(/diagnostic|blessure garantie/)
  })

  it('REMOVEs an optional session without trying to reschedule it', () => {
    const result = decideAdaptation({
      session: session('optional'),
      recentFeedback: [],
      missedReason: 'time',
      upcomingAvailability: [{ date: '2026-06-11', minutes: 120 }],
    })
    expect(result.type).toBe('REMOVE')
  })

  it('REMOVEs a secondary session rather than stacking it onto the next one', () => {
    const result = decideAdaptation({
      session: session('secondary'),
      recentFeedback: [],
      missedReason: 'unexpected',
      upcomingAvailability: [{ date: '2026-06-11', minutes: 120 }],
    })
    expect(result.type).toBe('REMOVE')
  })

  it('MOVEs a key session to the earliest slot that fits it', () => {
    const s = session('key', 60)
    const result = decideAdaptation({
      session: s,
      recentFeedback: [],
      missedReason: 'time',
      upcomingAvailability: [
        { date: '2026-06-11', minutes: 30 },
        { date: '2026-06-12', minutes: 90 },
      ],
    })
    expect(result.type).toBe('MOVE')
    expect(result.after.date).toBe('2026-06-12')
    expect(result.after.estimatedDurationMin).toBe(s.estimatedDurationMin)
  })

  it('REPLACEs a key session with a shorter version when no slot fits', () => {
    const s = session('key', 60)
    const result = decideAdaptation({
      session: s,
      recentFeedback: [],
      missedReason: 'time',
      upcomingAvailability: [{ date: '2026-06-11', minutes: 20 }],
    })
    expect(result.type).toBe('REPLACE')
    expect(result.after.estimatedDurationMin).toBeLessThan(s.estimatedDurationMin)
    expect(result.after.estimatedDurationMin).toBeGreaterThan(0)
  })

  it('REPLACEs a key session with a shorter version when there is no availability at all', () => {
    const s = session('key', 60)
    const result = decideAdaptation({ session: s, recentFeedback: [], missedReason: 'weather' })
    expect(result.type).toBe('REPLACE')
  })
})

describe('decideAdaptation — invariants (brief §49)', () => {
  it('never produces a zero or negative duration', () => {
    const tiny = session('secondary', 10)
    const reduced = decideAdaptation({ session: tiny, readiness: 'tired', recentFeedback: [] })
    expect(reduced.after.estimatedDurationMin).toBeGreaterThan(0)

    const replaced = decideAdaptation({
      session: session('key', 10),
      recentFeedback: [],
      missedReason: 'time',
    })
    expect(replaced.after.estimatedDurationMin).toBeGreaterThan(0)
  })

  it('REDUCE always makes the session shorter or equal, never longer', () => {
    const result = decideAdaptation({ session: session(), readiness: 'tired', recentFeedback: [] })
    expect(result.after.estimatedDurationMin).toBeLessThanOrEqual(result.before.estimatedDurationMin)
  })

  it('INCREASE always makes the session longer or equal, never shorter', () => {
    const result = decideAdaptation({
      session: session('secondary'),
      readiness: 'great',
      recentFeedback: [feedbackWithRpe(2), feedbackWithRpe(3)],
    })
    expect(result.after.estimatedDurationMin).toBeGreaterThanOrEqual(result.before.estimatedDurationMin)
  })

  it('every decision carries at least one reason code', () => {
    const results = [
      decideAdaptation({ session: session(), recentFeedback: [] }),
      decideAdaptation({ session: session(), readiness: 'tired', recentFeedback: [] }),
      decideAdaptation({ session: session('key'), recentFeedback: [], missedReason: 'pain' }),
    ]
    for (const r of results) {
      expect(r.reasons.length).toBeGreaterThan(0)
      expect(r.explanation.length).toBeGreaterThan(0)
    }
  })
})

describe('decideAvailabilityConstraint', () => {
  it('KEEPs when today\'s available time already covers the session', () => {
    const result = decideAvailabilityConstraint(session('key', 60), 90)
    expect(result.type).toBe('KEEP')
  })

  it('REDUCEs to fit the time actually available', () => {
    const result = decideAvailabilityConstraint(session('key', 60), 30)
    expect(result.type).toBe('REDUCE')
    expect(result.after.estimatedDurationMin).toBe(30)
    expect(result.reasons).toContain('REDUCED_AVAILABILITY_TODAY')
  })

  it('never reduces below the minimum viable session length', () => {
    const result = decideAvailabilityConstraint(session('key', 60), 2)
    expect(result.after.estimatedDurationMin).toBeGreaterThan(0)
  })

  it('does not compound across repeated same-day availability adjustments', () => {
    const first = decideAvailabilityConstraint(session('key', 60), 40)
    const afterFirst = applyDurationAdaptation(session('key', 60), first)
    expect(afterFirst.estimatedDurationMin).toBe(40)

    // Re-declaring the same 40 minutes on the already-reduced session must
    // land on 40 again, not scale 40 down further.
    const second = decideAvailabilityConstraint(afterFirst, 40)
    expect(second.after.estimatedDurationMin).toBe(40)
  })
})
