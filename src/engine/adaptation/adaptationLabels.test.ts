import { describe, expect, it } from 'vitest'
import type { AdaptationDecision } from './AdaptationDecision'
import { describeAdaptationChange } from './adaptationLabels'

function decisionWith(before: AdaptationDecision['before'], after: AdaptationDecision['after']): AdaptationDecision {
  return { type: 'REDUCE', sessionId: 's', reasons: ['NO_SIGNAL'], before, after, explanation: 'x' }
}

describe('describeAdaptationChange', () => {
  it('formats a duration change', () => {
    const decision = decisionWith({ estimatedDurationMin: 70 }, { estimatedDurationMin: 49 })
    expect(describeAdaptationChange(decision)).toBe('70 min → 49 min')
  })

  it('formats a date change over a duration change when both are present', () => {
    const decision = decisionWith(
      { estimatedDurationMin: 60, date: '2026-06-01' },
      { estimatedDurationMin: 60, date: '2026-06-03' },
    )
    expect(describeAdaptationChange(decision)).toMatch(/→/)
  })

  it('returns undefined when nothing changed', () => {
    const snapshot = { estimatedDurationMin: 60 }
    const decision = decisionWith(snapshot, snapshot)
    expect(describeAdaptationChange(decision)).toBeUndefined()
  })
})
