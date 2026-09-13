import { getAvailableMinutes, type Availability } from '@/core/availability/Availability'
import { findSessionForDate, type TrainingPlan } from '@/core/training/TrainingPlan'
import type { DateISO } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import type { AvailableSlot } from './decideAdaptation'

const DEFAULT_LOOKAHEAD_DAYS = 6
/** Below this, a slot isn't worth offering to MOVE a session into. */
const MIN_VIABLE_MINUTES = 15

/**
 * Candidate days a missed key session could MOVE into: free minutes exist
 * and no session is already planned there (moving one session must never
 * silently bump another — brief §29 no training debt). Earliest first.
 */
export function computeUpcomingSlots(options: {
  availability: Availability
  plan: TrainingPlan
  fromDateExclusive: DateISO
  lookaheadDays?: number
}): AvailableSlot[] {
  const days = options.lookaheadDays ?? DEFAULT_LOOKAHEAD_DAYS
  const slots: AvailableSlot[] = []

  for (let i = 1; i <= days; i++) {
    const date = addDays(options.fromDateExclusive, i)
    const minutes = getAvailableMinutes(options.availability, date)
    if (minutes < MIN_VIABLE_MINUTES) continue
    if (findSessionForDate(options.plan, date)) continue
    slots.push({ date, minutes })
  }

  return slots
}
