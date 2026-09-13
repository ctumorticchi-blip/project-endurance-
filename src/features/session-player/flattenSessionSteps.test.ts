import { describe, expect, it } from 'vitest'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { flattenSessionSteps } from './flattenSessionSteps'

function session(blocks: Parameters<typeof createPlannedSession>[0]['blocks']) {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'sweet-spot',
    title: 'Test',
    objective: 'Test',
    blocks,
    estimatedDurationMin: 60,
    priority: 'key',
    date: '2026-06-01',
    weekId: 'week-1',
  })
}

describe('flattenSessionSteps', () => {
  it('keeps a single non-repeating block as one step', () => {
    const s = session([
      { id: 'b1', label: 'Warmup', durationSec: 600, targetRpeMin: 2, targetRpeMax: 4 },
    ])
    const steps = flattenSessionSteps(s)
    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({ kind: 'work', repIndex: 1, totalReps: 1 })
  })

  it('interleaves rest between reps but not after the last one', () => {
    const s = session([
      {
        id: 'b1',
        label: 'Interval',
        durationSec: 480,
        repeat: 3,
        restSec: 240,
        targetRpeMin: 6,
        targetRpeMax: 7,
      },
    ])
    const steps = flattenSessionSteps(s)
    // work, rest, work, rest, work — 5 steps, not 6.
    expect(steps.map((s) => s.kind)).toEqual(['work', 'rest', 'work', 'rest', 'work'])
    expect(steps.filter((s) => s.kind === 'work')).toHaveLength(3)
  })

  it('does not insert rest when the block has none configured', () => {
    const s = session([
      { id: 'b1', label: 'Repeat, no rest', durationSec: 60, repeat: 4, targetRpeMin: 3, targetRpeMax: 5 },
    ])
    const steps = flattenSessionSteps(s)
    expect(steps).toHaveLength(4)
    expect(steps.every((s) => s.kind === 'work')).toBe(true)
  })

  it('produces unique keys for every step', () => {
    const s = session([
      { id: 'b1', label: 'A', durationSec: 60, repeat: 2, restSec: 30, targetRpeMin: 1, targetRpeMax: 3 },
      { id: 'b2', label: 'B', durationSec: 60, repeat: 2, restSec: 30, targetRpeMin: 1, targetRpeMax: 3 },
    ])
    const steps = flattenSessionSteps(s)
    expect(new Set(steps.map((s) => s.key)).size).toBe(steps.length)
  })

  it('preserves block order across multiple blocks', () => {
    const s = session([
      { id: 'warmup', label: 'Warmup', durationSec: 300, targetRpeMin: 2, targetRpeMax: 4 },
      { id: 'main', label: 'Main set', durationSec: 480, repeat: 2, restSec: 60, targetRpeMin: 6, targetRpeMax: 7 },
      { id: 'cooldown', label: 'Cooldown', durationSec: 300, targetRpeMin: 1, targetRpeMax: 3 },
    ])
    const steps = flattenSessionSteps(s)
    expect(steps.map((s) => s.blockId)).toEqual(['warmup', 'main', 'main', 'main', 'cooldown'])
  })
})
