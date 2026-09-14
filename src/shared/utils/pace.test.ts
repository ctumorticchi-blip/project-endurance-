import { describe, expect, it } from 'vitest'
import { formatPaceMinSec } from './pace'

describe('formatPaceMinSec', () => {
  it('formats seconds-per-km as M:SS/km', () => {
    expect(formatPaceMinSec(270, '/km')).toBe('4:30/km')
  })

  it('pads single-digit seconds', () => {
    expect(formatPaceMinSec(245, '/km')).toBe('4:05/km')
  })

  it('formats seconds-per-100m the same way', () => {
    expect(formatPaceMinSec(95, '/100m')).toBe('1:35/100m')
  })

  it('rounds fractional seconds first', () => {
    expect(formatPaceMinSec(95.6, '/100m')).toBe('1:36/100m')
  })
})
