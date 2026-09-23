import { describe, expect, it } from 'vitest'
import { createSessionFeedback } from '@/core/history/SessionFeedback'
import { deriveOverallFatigueSignal } from './deriveOverallFatigueSignal'

describe('deriveOverallFatigueSignal', () => {
  it('returns false with fewer than 2 RPE-bearing entries', () => {
    const feedback = [createSessionFeedback({ plannedSessionId: 'a', outcome: 'completed', rpe: 9 })]
    expect(deriveOverallFatigueSignal(feedback)).toBe(false)
  })

  it('returns true when the recent RPE trend is consistently high', () => {
    const feedback = [
      createSessionFeedback({ plannedSessionId: 'a', outcome: 'completed', rpe: 9 }),
      createSessionFeedback({ plannedSessionId: 'b', outcome: 'completed', rpe: 8 }),
      createSessionFeedback({ plannedSessionId: 'c', outcome: 'completed', rpe: 9 }),
    ]
    expect(deriveOverallFatigueSignal(feedback)).toBe(true)
  })

  it('returns false when the recent RPE trend is normal', () => {
    const feedback = [
      createSessionFeedback({ plannedSessionId: 'a', outcome: 'completed', rpe: 5 }),
      createSessionFeedback({ plannedSessionId: 'b', outcome: 'completed', rpe: 4 }),
    ]
    expect(deriveOverallFatigueSignal(feedback)).toBe(false)
  })

  it('ignores entries with no RPE recorded (e.g. missed sessions)', () => {
    const feedback = [
      createSessionFeedback({ plannedSessionId: 'a', outcome: 'missed', missedReason: 'time' }),
      createSessionFeedback({ plannedSessionId: 'b', outcome: 'missed', missedReason: 'time' }),
    ]
    expect(deriveOverallFatigueSignal(feedback)).toBe(false)
  })
})
