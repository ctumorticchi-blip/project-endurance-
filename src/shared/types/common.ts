/** ISO 8601 date string, e.g. "2026-11-01". No time component — races and
 * availability are reasoned about in whole days. */
export type DateISO = string

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

/** Coarse self-reported skill level. Used for both general sport experience
 * and per-discipline level — never a precise score (see docs/metrics.md:
 * no false precision). */
export type Level = 'beginner' | 'intermediate' | 'advanced'

export type Discipline = 'swim' | 'bike' | 'run' | 'strength' | 'mobility' | 'brick'

export const DISCIPLINES: readonly Discipline[] = ['swim', 'bike', 'run', 'strength', 'mobility', 'brick']
