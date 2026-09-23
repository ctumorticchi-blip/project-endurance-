import { describe, expect, it } from 'vitest'
import {
  appendProgressionExposure,
  createInitialProgressionState,
  PROGRESSION_HISTORY_LENGTH,
} from './progressionState'

describe('createInitialProgressionState', () => {
  it('starts at level 1 with no history by default', () => {
    const state = createInitialProgressionState('RUN_THRESHOLD')
    expect(state).toEqual({ familyId: 'RUN_THRESHOLD', currentLevel: 1, history: [] })
  })

  it('accepts a custom starting level', () => {
    const state = createInitialProgressionState('RUN_THRESHOLD', 3)
    expect(state.currentLevel).toBe(3)
  })
})

describe('appendProgressionExposure', () => {
  it('appends without mutating the original state', () => {
    const state = createInitialProgressionState('RUN_THRESHOLD')
    const exposure = { date: '2026-06-01', level: 1, outcome: 'completed' as const }
    const next = appendProgressionExposure(state, exposure)

    expect(state.history).toHaveLength(0)
    expect(next.history).toEqual([exposure])
  })

  it('caps history at PROGRESSION_HISTORY_LENGTH, dropping the oldest first', () => {
    let state = createInitialProgressionState('RUN_THRESHOLD')
    for (let i = 0; i < PROGRESSION_HISTORY_LENGTH + 3; i++) {
      state = appendProgressionExposure(state, { date: `2026-06-${i + 1}`, level: 1, outcome: 'completed' })
    }
    expect(state.history).toHaveLength(PROGRESSION_HISTORY_LENGTH)
    expect(state.history[0]!.date).toBe('2026-06-4') // the first 3 were dropped
    expect(state.history.at(-1)!.date).toBe(`2026-06-${PROGRESSION_HISTORY_LENGTH + 3}`)
  })
})
