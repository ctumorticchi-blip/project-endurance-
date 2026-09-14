import { describe, expect, it } from 'vitest'
import {
  createAvailabilityException,
  createEmptyWeeklyPattern,
  getAvailableMinutes,
  hasPoolAccess,
  resolveDesiredRestDays,
  resolveRestDates,
  type Availability,
} from './Availability'
import { addDays } from '@/shared/utils/date'

function buildAvailability(): Availability {
  const pattern = createEmptyWeeklyPattern()
  // 2026-06-06 is a Saturday.
  pattern.saturday = { available: true, minutes: 120, poolAccess: false }
  pattern.tuesday = { available: true, minutes: 45, poolAccess: true }
  return { weeklyPattern: pattern, exceptions: [] }
}

describe('getAvailableMinutes', () => {
  it('reads minutes from the weekly pattern when there is no exception', () => {
    const availability = buildAvailability()
    expect(getAvailableMinutes(availability, '2026-06-06')).toBe(120)
  })

  it('returns 0 for a day marked unavailable', () => {
    const availability = buildAvailability()
    expect(getAvailableMinutes(availability, '2026-06-07')).toBe(0)
  })

  it('an "unavailable" exception overrides the weekly pattern', () => {
    const availability = buildAvailability()
    availability.exceptions.push(
      createAvailabilityException({ date: '2026-06-06', type: 'unavailable', reason: 'travel' }),
    )
    expect(getAvailableMinutes(availability, '2026-06-06')).toBe(0)
  })

  it('a "reduced" exception overrides the weekly pattern with its own minutes', () => {
    const availability = buildAvailability()
    availability.exceptions.push(
      createAvailabilityException({ date: '2026-06-06', type: 'reduced', minutes: 30 }),
    )
    expect(getAvailableMinutes(availability, '2026-06-06')).toBe(30)
  })

  it('an "extra" exception grants minutes on an otherwise unavailable day', () => {
    const availability = buildAvailability()
    availability.exceptions.push(
      createAvailabilityException({ date: '2026-06-07', type: 'extra', minutes: 60 }),
    )
    expect(getAvailableMinutes(availability, '2026-06-07')).toBe(60)
  })
})

describe('hasPoolAccess', () => {
  it('reflects the weekly pattern', () => {
    const availability = buildAvailability()
    expect(hasPoolAccess(availability, '2026-06-02')).toBe(true) // Tuesday
    expect(hasPoolAccess(availability, '2026-06-06')).toBe(false) // Saturday
  })

  it('is false when the day is marked unavailable by an exception', () => {
    const availability = buildAvailability()
    availability.exceptions.push(
      createAvailabilityException({ date: '2026-06-02', type: 'unavailable' }),
    )
    expect(hasPoolAccess(availability, '2026-06-02')).toBe(false)
  })
})

describe('resolveDesiredRestDays', () => {
  it('defaults to the minimum when unset (older saved records, or unanswered)', () => {
    expect(resolveDesiredRestDays(buildAvailability())).toBe(1)
  })

  it('respects a higher request', () => {
    expect(resolveDesiredRestDays({ ...buildAvailability(), desiredRestDaysPerWeek: 3 })).toBe(3)
  })

  it('never goes below the minimum even if the athlete asks for zero', () => {
    expect(resolveDesiredRestDays({ ...buildAvailability(), desiredRestDaysPerWeek: 0 })).toBe(1)
  })
})

describe('resolveRestDates', () => {
  const weekStart = '2026-06-01' // a Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  it('returns an empty set when no explicit rest day is configured (old data)', () => {
    expect(resolveRestDates(buildAvailability(), weekDates)).toEqual(new Set())
  })

  it('resolves a single chosen weekday to its date within the week', () => {
    const availability: Availability = { ...buildAvailability(), restDays: ['sunday'] }
    expect(resolveRestDates(availability, weekDates)).toEqual(new Set(['2026-06-07']))
  })

  it('resolves multiple chosen weekdays', () => {
    const availability: Availability = { ...buildAvailability(), restDays: ['wednesday', 'sunday'] }
    expect(resolveRestDates(availability, weekDates)).toEqual(new Set(['2026-06-03', '2026-06-07']))
  })

  it('returns an empty set when the chosen weekday does not fall within this (shortened) week', () => {
    const shortWeek = weekDates.slice(0, 3) // Monday-Wednesday only
    const availability: Availability = { ...buildAvailability(), restDays: ['sunday'] }
    expect(resolveRestDates(availability, shortWeek)).toEqual(new Set())
  })

  it('a chosen rest day resolves to its date regardless of that day\'s own declared availability', () => {
    // Sunday marked unavailable in the weekly pattern AND separately chosen
    // as the explicit rest day — the exact scenario reported as producing
    // two rest days instead of one.
    const availability: Availability = { ...buildAvailability(), restDays: ['sunday'] }
    expect(resolveRestDates(availability, weekDates).size).toBe(1)
  })
})
