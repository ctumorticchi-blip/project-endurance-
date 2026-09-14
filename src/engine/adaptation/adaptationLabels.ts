import type { AdaptationDecision, AdaptationType } from './AdaptationDecision'

export const ADAPTATION_TYPE_LABELS: Record<AdaptationType, string> = {
  KEEP: 'Inchangé',
  REDUCE: 'Réduit',
  INCREASE: 'Augmenté',
  MOVE: 'Déplacé',
  REPLACE: 'Remplacé',
  REMOVE: 'Retiré',
}

/** Tone for each decision type in a standalone context (not nested inside
 * another tinted container — see CoachInsight, which overrides to
 * "neutral" specifically because it nests this badge inside a translucent
 * accent banner and stacking two tinted layers fails contrast). */
export const ADAPTATION_TYPE_TONE: Record<AdaptationType, 'neutral' | 'primary' | 'accent' | 'warning' | 'danger'> = {
  KEEP: 'neutral',
  REDUCE: 'warning',
  INCREASE: 'primary',
  MOVE: 'accent',
  REPLACE: 'accent',
  REMOVE: 'danger',
}

function formatShortDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * A compact "before → after" line derived from the decision's snapshots —
 * the same numbers already in `explanation`, but scannable at a glance in
 * a list. Returns undefined when nothing actually changed (KEEP, or a
 * REMOVE where before/after are the same snapshot) rather than showing a
 * no-op line.
 */
export function describeAdaptationChange(decision: AdaptationDecision): string | undefined {
  const { before, after } = decision
  if (before.date && after.date && before.date !== after.date) {
    return `${formatShortDate(before.date)} → ${formatShortDate(after.date)}`
  }
  if (before.estimatedDurationMin !== after.estimatedDurationMin) {
    return `${before.estimatedDurationMin} min → ${after.estimatedDurationMin} min`
  }
  return undefined
}
