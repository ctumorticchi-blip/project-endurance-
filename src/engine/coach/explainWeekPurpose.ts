import type { TrainingPhaseName } from '@/core/training/TrainingPlan'

/**
 * A one-sentence "why does my week look like this" (brief §38/§39's
 * minimal UX requirement — Plan screen only, not a new dashboard). Phase-
 * keyed rather than session-by-session: the phase is the single biggest
 * driver of a week's shape, and a short, always-available explanation
 * beats a more detailed one that only renders when extra context happens
 * to be in scope. PRODUCT_RULE — fixed copy, not derived from any
 * athlete-specific evidence.
 */
const WEEK_PURPOSE_BY_PHASE: Record<TrainingPhaseName, string> = {
  base: "Phase de base : on construit ton endurance aérobie et ta technique avant d'ajouter de l'intensité.",
  build: 'Phase de développement : l’intensité augmente progressivement pour construire ta capacité à soutenir un effort plus soutenu.',
  specific: 'Phase spécifique : les séances se rapprochent des allures et de l’enchaînement du jour de course.',
  taper: "Affûtage : le volume diminue pour arriver reposé le jour J, tout en gardant un peu d'intensité.",
  race: 'Semaine de course : l’objectif est d’arriver frais. Les séances sont courtes et faciles, juste de quoi rester activé.',
}

export function explainWeekPurpose(phase: TrainingPhaseName): string {
  return WEEK_PURPOSE_BY_PHASE[phase]
}
