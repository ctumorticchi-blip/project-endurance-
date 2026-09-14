import { describe, expect, it } from 'vitest'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import { formatBlock } from './workoutBlock'

function block(overrides: Partial<WorkoutBlock>): WorkoutBlock {
  return { id: 'b', label: 'Bloc', targetRpeMin: 3, targetRpeMax: 5, ...overrides }
}

describe('formatBlock', () => {
  it('formats a simple duration block', () => {
    expect(formatBlock(block({ durationSec: 600 }))).toBe('10 min')
  })

  it('formats repeats, duration and rest together', () => {
    expect(formatBlock(block({ repeat: 3, durationSec: 480, restSec: 60 }))).toBe('3 x 8 min récup 60s')
  })

  it('formats a distance-based block', () => {
    expect(formatBlock(block({ distanceMeters: 400 }))).toBe('400 m')
  })

  it('omits repeat when it is 1', () => {
    expect(formatBlock(block({ repeat: 1, durationSec: 300 }))).toBe('5 min')
  })
})
