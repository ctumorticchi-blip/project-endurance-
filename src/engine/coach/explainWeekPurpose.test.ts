import { describe, expect, it } from 'vitest'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import { explainWeekPurpose } from './explainWeekPurpose'

describe('explainWeekPurpose', () => {
  it('gives a distinct, non-empty explanation for every training phase', () => {
    const phases: TrainingPhaseName[] = ['base', 'build', 'specific', 'taper', 'race']
    const explanations = phases.map(explainWeekPurpose)
    for (const explanation of explanations) {
      expect(explanation.length).toBeGreaterThan(0)
    }
    expect(new Set(explanations).size).toBe(phases.length)
  })
})
