import { WEEKDAYS, type DateISO, type Weekday } from '@/shared/types/common'

export interface DayAvailability {
  available: boolean
  /** Minutes available that day. Ignored when `available` is false. */
  minutes: number
  /** Pool access that day — only meaningful when `available` is true. */
  poolAccess: boolean
}

export type WeeklyPattern = Record<Weekday, DayAvailability>

export type AvailabilityExceptionType = 'unavailable' | 'reduced' | 'extra'

export interface AvailabilityException {
  id: string
  date: DateISO
  type: AvailabilityExceptionType
  /** Required for 'reduced' and 'extra'; ignored for 'unavailable'. */
  minutes?: number
  reason?: string
}

export interface Availability {
  weeklyPattern: WeeklyPattern
  exceptions: AvailabilityException[]
}

export function createEmptyWeeklyPattern(): WeeklyPattern {
  const pattern = {} as WeeklyPattern
  for (const day of WEEKDAYS) {
    pattern[day] = { available: false, minutes: 0, poolAccess: false }
  }
  return pattern
}

export function createAvailabilityException(
  input: Omit<AvailabilityException, 'id'>,
): AvailabilityException {
  return { ...input, id: crypto.randomUUID() }
}

function weekdayOf(date: DateISO): Weekday {
  // getDay(): 0=Sunday..6=Saturday. WEEKDAYS is Monday-first.
  const jsDay = new Date(date).getDay()
  return WEEKDAYS[(jsDay + 6) % 7] as Weekday
}

/**
 * Resolves how many minutes are actually available on a given date,
 * exceptions taking precedence over the weekly pattern. Never mutates the
 * weekly pattern to "pay off" a missed day elsewhere — that is the
 * adaptation engine's job, not this resolver's (brief §22/§29: no automatic
 * training debt).
 */
export function getAvailableMinutes(availability: Availability, date: DateISO): number {
  const exception = availability.exceptions.find((e) => e.date === date)
  if (exception) {
    if (exception.type === 'unavailable') return 0
    return exception.minutes ?? 0
  }

  const day = availability.weeklyPattern[weekdayOf(date)]
  return day.available ? day.minutes : 0
}

export function hasPoolAccess(availability: Availability, date: DateISO): boolean {
  const exception = availability.exceptions.find((e) => e.date === date)
  if (exception?.type === 'unavailable') return false
  return availability.weeklyPattern[weekdayOf(date)].poolAccess
}
