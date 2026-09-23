import { describe, expect, it } from 'vitest'
import { appendProgressionExposure, createInitialProgressionState } from '@/core/coaching/progressionState'
import { decideProgressionResponse, type ProgressionEvidenceContext } from './decideProgressionResponse'

function contextWith(overrides: Partial<ProgressionEvidenceContext>): ProgressionEvidenceContext {
  return {
    state: createInitialProgressionState('RUN_THRESHOLD'),
    maxLevel: 5,
    recentOverallFatigueElevated: false,
    ...overrides,
  }
}

describe('decideProgressionResponse', () => {
  it('MAINTAINs with no history yet', () => {
    const result = decideProgressionResponse(contextWith({}))
    expect(result.decision).toBe('MAINTAIN')
    expect(result.reasonCodes).toContain('INSUFFICIENT_HISTORY')
    expect(result.nextLevel).toBe(1)
  })

  it('RECOVERs when overall fatigue is elevated, regardless of last exposure', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 2), {
      date: '2026-06-01',
      level: 2,
      outcome: 'completed',
      targetRpe: 7,
      actualRpe: 5,
    })
    const result = decideProgressionResponse(contextWith({ state, recentOverallFatigueElevated: true }))
    expect(result.decision).toBe('RECOVER')
    expect(result.reasonCodes).toEqual(['PERSISTENT_FATIGUE'])
    expect(result.nextLevel).toBe(2)
  })

  it('PROGRESSes when the last exposure felt clearly easier than its target RPE', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 2), {
      date: '2026-06-01',
      level: 2,
      outcome: 'completed',
      targetRpe: 7,
      actualRpe: 5,
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('PROGRESS')
    expect(result.reasonCodes).toEqual(['ATHLETE_READY_TO_PROGRESS'])
    expect(result.nextLevel).toBe(3)
  })

  it('never progresses past the family\'s max level', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 5), {
      date: '2026-06-01',
      level: 5,
      outcome: 'completed',
      targetRpe: 7,
      actualRpe: 4,
    })
    const result = decideProgressionResponse(contextWith({ state, maxLevel: 5 }))
    expect(result.decision).toBe('MAINTAIN')
    expect(result.reasonCodes).toContain('MAX_LEVEL_REACHED')
    expect(result.nextLevel).toBe(5)
  })

  it('REGRESSes when the last exposure felt clearly harder than its target RPE', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 3), {
      date: '2026-06-01',
      level: 3,
      outcome: 'completed',
      targetRpe: 6,
      actualRpe: 9,
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('REGRESS')
    expect(result.reasonCodes).toEqual(['RPE_HIGHER_THAN_EXPECTED'])
    expect(result.nextLevel).toBe(2)
  })

  it('never regresses below level 1', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 1), {
      date: '2026-06-01',
      level: 1,
      outcome: 'completed',
      targetRpe: 6,
      actualRpe: 9,
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.nextLevel).toBe(1)
  })

  it('MAINTAINs when RPE matches the target within the neutral band', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 2), {
      date: '2026-06-01',
      level: 2,
      outcome: 'completed',
      targetRpe: 7,
      actualRpe: 7,
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('MAINTAIN')
    expect(result.reasonCodes).toEqual(['TARGET_RPE_MATCHED'])
    expect(result.nextLevel).toBe(2)
  })

  it('REGRESSes on a partial completion even without RPE data', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 3), {
      date: '2026-06-01',
      level: 3,
      outcome: 'partial',
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('REGRESS')
    expect(result.nextLevel).toBe(2)
  })

  it('MAINTAINs (does not punish) a missed exposure', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 3), {
      date: '2026-06-01',
      level: 3,
      outcome: 'missed',
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('MAINTAIN')
    expect(result.reasonCodes).toEqual(['MISSED_LAST_EXPOSURE'])
    expect(result.nextLevel).toBe(3)
  })

  it('MAINTAINs a completed exposure with no RPE recorded (insufficient signal, not a false PROGRESS/REGRESS)', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 2), {
      date: '2026-06-01',
      level: 2,
      outcome: 'completed',
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('MAINTAIN')
    expect(result.reasonCodes).toEqual(['INSUFFICIENT_HISTORY'])
  })

  it('does not RECALIBRATE from a single easy-feeling session — only sustained evidence', () => {
    const state = appendProgressionExposure(createInitialProgressionState('RUN_THRESHOLD', 2), {
      date: '2026-06-01',
      level: 2,
      outcome: 'completed',
      targetRpe: 7,
      actualRpe: 4, // a big single mismatch — still just one data point
    })
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).not.toBe('RECALIBRATE')
  })

  it('RECALIBRATEs when several consecutive exposures are all consistently much easier than their target', () => {
    let state = createInitialProgressionState('RUN_THRESHOLD', 2)
    for (let i = 0; i < 3; i++) {
      state = appendProgressionExposure(state, {
        date: `2026-06-0${i + 1}`,
        level: 2,
        outcome: 'completed',
        targetRpe: 7,
        actualRpe: 5,
      })
    }
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('RECALIBRATE')
    expect(result.reasonCodes).toEqual(['ZONE_RECALIBRATION_REQUIRED'])
    expect(result.nextLevel).toBe(state.currentLevel) // the level itself doesn't move
  })

  it('RECALIBRATEs when several consecutive exposures are all consistently much harder than their target', () => {
    let state = createInitialProgressionState('RUN_THRESHOLD', 2)
    for (let i = 0; i < 3; i++) {
      state = appendProgressionExposure(state, {
        date: `2026-06-0${i + 1}`,
        level: 2,
        outcome: 'completed',
        targetRpe: 6,
        actualRpe: 8,
      })
    }
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).toBe('RECALIBRATE')
  })

  it('does not RECALIBRATE when the mismatch direction is inconsistent across exposures', () => {
    let state = createInitialProgressionState('RUN_THRESHOLD', 2)
    const deltas = [5, 9, 5] // easier, harder, easier — no consistent direction
    for (let i = 0; i < deltas.length; i++) {
      state = appendProgressionExposure(state, {
        date: `2026-06-0${i + 1}`,
        level: 2,
        outcome: 'completed',
        targetRpe: 7,
        actualRpe: deltas[i],
      })
    }
    const result = decideProgressionResponse(contextWith({ state }))
    expect(result.decision).not.toBe('RECALIBRATE')
  })
})
