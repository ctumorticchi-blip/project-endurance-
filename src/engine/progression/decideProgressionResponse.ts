import type {
  FamilyProgressionState,
  ProgressionExposure,
  ProgressionReasonCode,
  ProgressionResponse,
} from '@/core/coaching/progressionState'

/**
 * Thresholds for the progression response engine (brief §14). All
 * COACHING_HEURISTIC / PRODUCT_RULE — see `docs/progression-engine.md` for
 * the full classification. A single exposure is enough to move the ladder
 * one level (a coach reacts to how last week's key session actually went),
 * but recalibrating the *zone itself* requires repeated, consistent
 * evidence — the same "don't overreact to one data point" philosophy
 * `engine/adaptation/decideAdaptation.ts` already applies to same-day
 * duration tweaks, applied here to the slower-moving ladder-level decision.
 */
const PROGRESS_RPE_MARGIN = 1
const REGRESS_RPE_MARGIN = 1.5
const MIN_EXPOSURES_FOR_RECALIBRATION = 3
const RECALIBRATE_RPE_MARGIN = 1.5

export interface ProgressionEvidenceContext {
  state: FamilyProgressionState
  /** The family's ladder length — `WorkoutFamily.progressionLevels`. */
  maxLevel: number
  /** Derived from recent readiness check-ins / overall RPE trend across
   * *all* disciplines, not just this family — accumulated fatigue pauses
   * every family's progression at once, it isn't family-specific. */
  recentOverallFatigueElevated: boolean
}

function response(
  decision: ProgressionResponse['decision'],
  reasonCodes: ProgressionReasonCode[],
  explanation: string,
  nextLevel: number,
): ProgressionResponse {
  return { decision, reasonCodes, explanation, nextLevel }
}

/** True once the last `MIN_EXPOSURES_FOR_RECALIBRATION` exposures all carry
 * RPE data and all mismatch the target in the *same direction* by at least
 * `RECALIBRATE_RPE_MARGIN` — the signal that the zone itself (not the
 * workout level) needs a fresh test, not just "yesterday felt off". */
function detectSustainedMismatch(history: ProgressionExposure[]): 'easier' | 'harder' | undefined {
  if (history.length < MIN_EXPOSURES_FOR_RECALIBRATION) return undefined
  const recent = history.slice(-MIN_EXPOSURES_FOR_RECALIBRATION)
  const deltas = recent.map((e) =>
    e.targetRpe !== undefined && e.actualRpe !== undefined ? e.actualRpe - e.targetRpe : undefined,
  )
  if (deltas.some((d) => d === undefined)) return undefined

  const allEasier = deltas.every((d) => d! <= -RECALIBRATE_RPE_MARGIN)
  const allHarder = deltas.every((d) => d! >= RECALIBRATE_RPE_MARGIN)
  if (allEasier) return 'easier'
  if (allHarder) return 'harder'
  return undefined
}

/**
 * Reasons about one workout family's progression trend and decides what
 * its *next* exposure should target — the closed loop the audit found
 * genuinely missing from the existing engine (today's `SessionTier` only
 * follows a fixed week-position curve, never the athlete's actual
 * response). Deterministic, explainable, and — per the "one session
 * doesn't rewrite the plan" house rule — recalibration specifically
 * requires several consistent exposures, never a single one.
 */
export function decideProgressionResponse(context: ProgressionEvidenceContext): ProgressionResponse {
  const { state, maxLevel } = context
  const last = state.history.at(-1)

  if (!last) {
    return response(
      'MAINTAIN',
      ['INSUFFICIENT_HISTORY'],
      "Pas encore d'historique sur cette famille de séance : on garde le niveau de départ.",
      state.currentLevel,
    )
  }

  if (context.recentOverallFatigueElevated) {
    return response(
      'RECOVER',
      ['PERSISTENT_FATIGUE'],
      'Ta fatigue accumulée récente est élevée : on met la progression de cette famille de séance en pause, sans reculer.',
      state.currentLevel,
    )
  }

  const sustainedMismatch = detectSustainedMismatch(state.history)
  if (sustainedMismatch) {
    return response(
      'RECALIBRATE',
      ['ZONE_RECALIBRATION_REQUIRED'],
      sustainedMismatch === 'easier'
        ? `Tes ${MIN_EXPOSURES_FOR_RECALIBRATION} dernières séances de ce type ont semblé nettement plus faciles que prévu : ta zone d'allure/puissance est probablement dépassée, pas seulement le niveau de la séance. Un nouveau test est recommandé.`
        : `Tes ${MIN_EXPOSURES_FOR_RECALIBRATION} dernières séances de ce type ont semblé nettement plus dures que prévu : ta zone d'allure/puissance est peut-être trop ambitieuse. Un nouveau test est recommandé.`,
      state.currentLevel,
    )
  }

  if (last.outcome === 'missed') {
    return response(
      'MAINTAIN',
      ['MISSED_LAST_EXPOSURE'],
      'La dernière exposition à cette famille de séance a été manquée : le niveau reste inchangé faute de nouvelle donnée.',
      state.currentLevel,
    )
  }

  if (last.outcome === 'partial') {
    const nextLevel = Math.max(1, state.currentLevel - 1)
    return response(
      'REGRESS',
      ['RPE_HIGHER_THAN_EXPECTED'],
      "La dernière séance n'a été complétée qu'en partie : on revient au niveau précédent avant de progresser à nouveau.",
      nextLevel,
    )
  }

  // outcome === 'completed'
  if (last.targetRpe === undefined || last.actualRpe === undefined) {
    return response(
      'MAINTAIN',
      ['INSUFFICIENT_HISTORY'],
      'Séance complétée, mais sans RPE renseigné : pas assez de signal pour juger la progression.',
      state.currentLevel,
    )
  }

  const delta = last.actualRpe - last.targetRpe

  if (delta <= -PROGRESS_RPE_MARGIN) {
    if (state.currentLevel >= maxLevel) {
      return response(
        'MAINTAIN',
        ['ATHLETE_READY_TO_PROGRESS', 'MAX_LEVEL_REACHED'],
        'Tu es prêt à progresser, mais cette famille de séance a atteint son niveau maximal actuel : on la maintient à son meilleur niveau.',
        state.currentLevel,
      )
    }
    return response(
      'PROGRESS',
      ['ATHLETE_READY_TO_PROGRESS'],
      `La dernière séance a semblé plus facile que prévu (RPE ${last.actualRpe} pour une cible de ${last.targetRpe}) : tu es prêt pour le niveau suivant.`,
      state.currentLevel + 1,
    )
  }

  if (delta >= REGRESS_RPE_MARGIN) {
    return response(
      'REGRESS',
      ['RPE_HIGHER_THAN_EXPECTED'],
      `La dernière séance a semblé plus dure que prévu (RPE ${last.actualRpe} pour une cible de ${last.targetRpe}) : on revient au niveau précédent.`,
      Math.max(1, state.currentLevel - 1),
    )
  }

  return response(
    'MAINTAIN',
    ['TARGET_RPE_MATCHED'],
    `Le ressenti correspond à ce qui était prévu (RPE ${last.actualRpe} pour une cible de ${last.targetRpe}) : on garde ce niveau encore une exposition.`,
    state.currentLevel,
  )
}
