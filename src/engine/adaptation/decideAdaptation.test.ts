import { describe, expect, it } from 'vitest'
import { createSessionFeedback, type SessionFeedback } from '@/core/history/SessionFeedback'
import { createPlannedSession, type PlannedSession, type SessionPriority } from '@/core/training/PlannedSession'
import { decideAdaptation } from './decideAdaptation'

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
