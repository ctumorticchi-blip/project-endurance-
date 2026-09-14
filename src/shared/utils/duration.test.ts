import { describe, expect, it } from 'vitest'
import { formatHoursAndMinutes } from './duration'

describe('formatHoursAndMinutes', () => {
  it('shows both hours and minutes when neither is zero', () => {
    expect(formatHoursAndMinutes(320)).toBe('5 h 20 min')
  })

  it('shows only minutes under an hour', () => {
    expect(formatHoursAndMinutes(45)).toBe('45 min')
  })

  it('shows only hours on an exact hour', () => {
    expect(formatHoursAndMinutes(180)).toBe('3 h')
  })

  it('handles zero', () => {
    expect(formatHoursAndMinutes(0)).toBe('0 min')
  })

  it('rounds fractional minutes before splitting', () => {
    expect(formatHoursAndMinutes(90.6)).toBe('1 h 31 min')
  })
})
