import { describe, expect, it } from 'vitest'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import { resolveBlockTargetDescription } from './intensityDisplay'

function block(overrides: Partial<WorkoutBlock> = {}): WorkoutBlock {
  return { id: 'b1', label: 'Bloc', targetRpeMin: 6, targetRpeMax: 8, targetZone: 'Z4', ...overrides }
}

describe('resolveBlockTargetDescription', () => {
  it('returns undefined for a block with no relative zone (RPE-only families)', () => {
    expect(resolveBlockTargetDescription('strength', block({ targetZone: undefined }), {})).toBeUndefined()
  })

  it('returns undefined when the athlete has no tested metric — never fabricates a number (brief §41)', () => {
    expect(resolveBlockTargetDescription('bike', block(), {})).toBeUndefined()
  })

  it('returns the real resolved power target when FTP is known, never duplicating the RPE fallback text', () => {
    const description = resolveBlockTargetDescription('bike', block(), {
      power: [{ name: 'Z4', label: 'Seuil', min: 200, max: 220 }],
    })
    expect(description).toBe('200–220 W')
    expect(description).not.toContain('RPE')
  })

  it('returns the real resolved pace target when threshold pace is known', () => {
    const description = resolveBlockTargetDescription('run', block(), {
      runPace: [{ name: 'Z4', label: 'Seuil', min: 270, max: 280 }],
    })
    expect(description).toContain('/km')
  })
})
