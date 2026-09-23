import type { SessionPriority } from '@/core/training/PlannedSession'

/**
 * The 3-level `PlannedSession.priority` translated for the athlete
 * (Coaching Experience V1 brief §5) — the single source for this mapping,
 * replacing three near-identical local consts that had drifted slightly
 * (`TodayPage.tsx`, `DayDetailPage.tsx`, `WeekCard.tsx` each declared their
 * own copy). "If my week gets complicated, how important is this
 * session?" should read the same word everywhere it appears.
 */
export const SESSION_PRIORITY_LABELS: Record<SessionPriority, string> = {
  key: 'Séance clé',
  secondary: 'Secondaire',
  optional: 'Optionnelle',
}

export const SESSION_PRIORITY_TONE: Record<SessionPriority, 'neutral' | 'primary'> = {
  key: 'primary',
  secondary: 'neutral',
  optional: 'neutral',
}
