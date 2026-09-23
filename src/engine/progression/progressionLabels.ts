import type { ProgressionDecision } from '@/core/coaching/progressionState'

/** User-facing translation of the 5 progression decisions (Coaching
 * Experience V1 brief §13) — mirrors `engine/adaptation/adaptationLabels.ts`'s
 * pattern for the analogous `AdaptationType`. Internal decision names never
 * shown literally (brief §34). */
export const PROGRESSION_DECISION_LABELS: Record<ProgressionDecision, string> = {
  PROGRESS: 'Progression',
  MAINTAIN: 'Maintien',
  REGRESS: 'Allègement',
  RECOVER: 'Récupération priorisée',
  RECALIBRATE: 'Recalibrage conseillé',
}

export const PROGRESSION_DECISION_TONE: Record<
  ProgressionDecision,
  'neutral' | 'primary' | 'accent' | 'warning' | 'danger'
> = {
  PROGRESS: 'primary',
  MAINTAIN: 'neutral',
  REGRESS: 'warning',
  RECOVER: 'warning',
  RECALIBRATE: 'accent',
}

/**
 * A compact "niveau X → niveau Y" line, only when the level actually
 * changes and the family's ladder length is known — otherwise `undefined`
 * (brief §21: never promise a change that didn't happen; a flat "niveau 2"
 * with nothing to compare to isn't worth a line).
 */
export function describeProgressionChange(
  previousLevel: number,
  response: { nextLevel: number },
  maxLevel?: number,
): string | undefined {
  if (previousLevel === response.nextLevel) return undefined
  const suffix = maxLevel ? `/${maxLevel}` : ''
  return `Niveau ${previousLevel}${suffix} → ${response.nextLevel}${suffix}`
}
