import type { DateISO } from '@/shared/types/common'

export function toISODate(date: Date): DateISO {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: DateISO, days: number): DateISO {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function startOfDay(date: Date): DateISO {
  return toISODate(date)
}

export function isAfterOrEqual(a: DateISO, b: DateISO): boolean {
  return new Date(a).getTime() >= new Date(b).getTime()
}

export function isBefore(a: DateISO, b: DateISO): boolean {
  return new Date(a).getTime() < new Date(b).getTime()
}

export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

/** Monday of the calendar week containing `date`, at local midnight —
 * the shared week boundary every history/trend bucketing function uses. */
export function mondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
