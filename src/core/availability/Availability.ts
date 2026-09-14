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

/** Below this, the plan generator always reserves at least one rest day
 * per week regardless of what the athlete requests or how many days are
 * marked available (brief feedback: rest is not optional, even for an
 * athlete who marks every day of the week as free). */
export const MIN_REST_DAYS_PER_WEEK = 1

export interface Availability {
  weeklyPattern: WeeklyPattern
  exceptions: AvailabilityException[]
  /** How many rest days per week the athlete asked for. Optional — absent
   * for availability records saved before this preference existed, and
   * treated the same as not having answered. The generator never
   * schedules more than 7 - max(this, MIN_REST_DAYS_PER_WEEK) training
   * days in a week, even if more days have available minutes. */
  desiredRestDaysPerWeek?: number
}

export function resolveDesiredRestDays(availability: Availability): number {
  return Math.max(MIN_REST_DAYS_PER_WEEK, availability.desiredRestDaysPerWeek ?? MIN_REST_DAYS_PER_WEEK)
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
