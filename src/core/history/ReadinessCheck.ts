import type { DateISO } from '@/shared/types/common'

/** M0 keeps the pre-session check-in to three levels on purpose (brief §23) — sleep,
 * stress, soreness, and wearables are explicitly deferred to a later milestone. */
export type ReadinessLevel = 'tired' | 'normal' | 'great'

export interface ReadinessCheck {
  id: string
  date: DateISO
  plannedSessionId: string
  level: ReadinessLevel
  createdAt: string
}

export function createReadinessCheck(
  input: Omit<ReadinessCheck, 'id' | 'createdAt'>,
): ReadinessCheck {
  return { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
}
