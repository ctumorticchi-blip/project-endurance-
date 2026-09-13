export type SessionOutcome = 'completed' | 'partial' | 'missed'

export type PerceivedDifficulty = 'harder-than-expected' | 'as-expected' | 'easier-than-expected'

export type MissedReason =
  | 'time'
  | 'fatigue'
  | 'pain'
  | 'unexpected'
  | 'weather'
  | 'equipment'
  | 'other'

export interface SessionFeedback {
  id: string
  plannedSessionId: string
  outcome: SessionOutcome
  /** 1-10. Present for 'completed' and 'partial', absent for 'missed'. */
  rpe?: number
  perceivedDifficulty?: PerceivedDifficulty
  comment?: string
  /** Present only when outcome is 'missed'. */
  missedReason?: MissedReason
  createdAt: string
}

export function createSessionFeedback(
  input: Omit<SessionFeedback, 'id' | 'createdAt'>,
): SessionFeedback {
  return { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
}
