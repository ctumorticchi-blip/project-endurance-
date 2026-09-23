import type { TrainingPhaseName, TrainingWeek } from '@/core/training/TrainingPlan'
import type { DisciplineStrengthAnalysis } from '@/sports/triathlon/coaching/limiterAnalysis'
import { DISCIPLINE_LABELS } from '@/shared/discipline'

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

function disciplineName(discipline: 'swim' | 'bike' | 'run'): string {
  return DISCIPLINE_LABELS[discipline].replace(/^\S+\s/, '')
}

export interface WeekComposition {
  /** The phase-level "why does training look like this right now" (unchanged). */
  phaseIntro: string
  /**
   * "Why this week allocates discipline time the way it does" (brief §11)
   * — derived from the week's *actual* generated sessions, never a second
   * heuristic: counts real sessions per discipline rather than restating
   * `limiterAnalysis.explanation` (which describes the athlete in general,
   * not this specific week). `undefined` for a balanced athlete, a race
   * week (composition reasoning doesn't matter days before the start
   * line), or a week where the limiter genuinely got no extra touch this
   * week (nothing dishonest to report).
   */
  limiterNote?: string
}

/**
 * Coaching Experience V1 (brief §11): replaces a second, disconnected
 * "why this week" heuristic with one grounded in the same limiter/strongest
 * analysis and the same generated sessions the Weekly Composer already
 * produced — never a UI guess about composition it can instead just count.
 */
export function explainWeekComposition(
  week: TrainingWeek,
  limiterAnalysis?: DisciplineStrengthAnalysis,
): WeekComposition {
  const phaseIntro = explainWeekPurpose(week.phase)
  if (!limiterAnalysis || limiterAnalysis.isBalanced || week.phase === 'race') return { phaseIntro }

  const limiterCount = week.sessions.filter((s) => s.discipline === limiterAnalysis.limiter).length
  if (limiterCount === 0) return { phaseIntro }

  const strongestCount = week.sessions.filter((s) => s.discipline === limiterAnalysis.strongest).length
  const limiterName = disciplineName(limiterAnalysis.limiter)
  const strongestName = disciplineName(limiterAnalysis.strongest)
  const limiterPlural = limiterCount > 1 ? 's' : ''

  const limiterNote =
    strongestCount > 0 && strongestCount < limiterCount
      ? `${limiterName} reste ton axe de progression actuel : ${limiterCount} séance${limiterPlural} cette semaine, contre ${strongestCount} en ${strongestName.toLowerCase()} pour l’entretenir sans lui consacrer un temps disproportionné.`
      : `${limiterName} reste ton axe de progression actuel cette semaine (${limiterCount} séance${limiterPlural}).`

  return { phaseIntro, limiterNote }
}
