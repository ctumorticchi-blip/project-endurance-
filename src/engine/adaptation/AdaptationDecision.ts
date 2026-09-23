import type { DateISO } from '@/shared/types/common'

export type AdaptationType = 'KEEP' | 'REDUCE' | 'INCREASE' | 'MOVE' | 'REPLACE' | 'REMOVE'

export type ReasonCode =
  | 'ELEVATED_FATIGUE'
  | 'REDUCED_AVAILABILITY_TODAY'
  | 'HIGH_RECENT_RPE'
  | 'LOW_RECENT_RPE'
  | 'HIGH_READINESS'
  | 'PAIN_REPORTED'
  | 'LOW_PRIORITY_SESSION'
  | 'KEY_SESSION_PROTECTED'
  | 'NO_AVAILABLE_SLOT'
  | 'INSUFFICIENT_HISTORY'
  | 'NO_SIGNAL'
  | 'TAPER_PROTECTION'

export interface AdaptationSnapshot {
  estimatedDurationMin: number
  date?: DateISO
}

/**
 * The engine's single structured output. Every field the UI or a future
 * AI layer needs to explain a decision without re-deriving it (brief §28):
 * what changed, why, and the before/after — never a bare mutation.
 */
export interface AdaptationDecision {
  type: AdaptationType
  sessionId: string
  reasons: ReasonCode[]
  before: AdaptationSnapshot
  after: AdaptationSnapshot
  explanation: string
}
