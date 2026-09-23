import { describe, expect, it } from 'vitest'
import type { ProgressionDecision } from '@/core/coaching/progressionState'
import {
  describeProgressionChange,
  PROGRESSION_DECISION_LABELS,
  PROGRESSION_DECISION_TONE,
} from './progressionLabels'

const ALL_DECISIONS: ProgressionDecision[] = ['PROGRESS', 'MAINTAIN', 'REGRESS', 'RECOVER', 'RECALIBRATE']

describe('PROGRESSION_DECISION_LABELS', () => {
  it('gives every decision a distinct, non-empty label — a PROGRESS badge can never read as MAINTAIN or vice versa (brief §58 contract)', () => {
    const labels = ALL_DECISIONS.map((d) => PROGRESSION_DECISION_LABELS[d])
    for (const label of labels) expect(label.length).toBeGreaterThan(0)
    expect(new Set(labels).size).toBe(ALL_DECISIONS.length)
  })

  it('never leaks the internal decision name literally into the label', () => {
    for (const decision of ALL_DECISIONS) {
      expect(PROGRESSION_DECISION_LABELS[decision]).not.toBe(decision)
    }
  })
})

describe('PROGRESSION_DECISION_TONE', () => {
  it('covers every decision', () => {
    for (const decision of ALL_DECISIONS) {
      expect(PROGRESSION_DECISION_TONE[decision]).toBeDefined()
    }
  })
})

describe('describeProgressionChange', () => {
  it('returns undefined when the level does not change — never implies a change that did not happen (brief §21)', () => {
    expect(describeProgressionChange(2, { nextLevel: 2 }, 5)).toBeUndefined()
  })

  it('shows a "before → after" line, with the ladder length, when the level does change', () => {
    expect(describeProgressionChange(2, { nextLevel: 3 }, 5)).toBe('Niveau 2/5 → 3/5')
  })

  it('omits the ladder length when it is unknown', () => {
    expect(describeProgressionChange(2, { nextLevel: 3 })).toBe('Niveau 2 → 3')
  })
})
