import type { SessionType } from '@/core/training/PlannedSession'

/** Consistent short French label for a `SessionType` (Coaching Experience
 * V1 brief §56: one vocabulary, not "seuil"/"tempo threshold"/"Z4 threshold"
 * depending on which screen happens to render it). */
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  technique: 'Technique',
  endurance: 'Endurance',
  tempo: 'Tempo',
  'sweet-spot': 'Sweet Spot',
  threshold: 'Seuil',
  vo2max: 'VO2max',
  css: 'CSS',
  intervals: 'Fractionné',
  long: 'Sortie longue',
  recovery: 'Récupération',
  strength: 'Renforcement',
  mobility: 'Mobilité',
  brick: 'Brick',
  transition: 'Transition',
  'race-specific': 'Allure de course',
}
