/**
 * User-facing translation of the Weekly Composer's `reasonCodes`
 * (`weeklyStimulusComposer.ts`'s `generateWeeklySessionRequirements`) —
 * the internal composition-time evidence for "why does this occurrence
 * exist this week", never shown as a raw code to the athlete (Coaching
 * Experience V1 brief §34: "internal reason codes must not leak into
 * normal UI").
 *
 * Deliberately a plain lookup with no coaching logic of its own — the
 * *decision* was already made by the composer; this only translates its
 * recorded reason into a sentence (brief §1's "ENGINE DECISION → STRUCTURED
 * REASON → USER-FACING EXPLANATION" pipeline, not a second heuristic).
 */
const REASON_CODE_EXPLANATIONS: Record<string, string> = {
  ANCHOR_SESSION: "C'est le stimulus principal de ta semaine pour cette discipline.",
  LIMITER_DEVELOPMENT_TOUCH: 'Cette séance cible ton axe de progression actuel.',
  STRONGEST_MAINTENANCE_TOUCH:
    'Séance d’entretien : on maintient ce niveau sans lui consacrer un temps disproportionné.',
  NEUTRAL_TOUCH: 'Séance complémentaire qui équilibre ta semaine.',
  POOL_UNAVAILABLE_REALLOCATED: "Ta piscine n'était pas disponible cette semaine : ce temps est réinvesti ici.",
  MINIMAL_COVERAGE: "Semaine à budget réduit : on couvre l'essentiel plutôt que d'ajouter du volume.",
  BRICK_PROGRESSION: "Cette séance fait partie de ta préparation progressive à l'enchaînement vélo-course.",
  RECOVERY_BUDGET_AVAILABLE:
    'Du temps restait disponible cette semaine pour ce renforcement, sans empiéter sur ta récupération.',
}

/** Only the first reason code is shown — a session can accumulate more
 * than one when generic (see `weeklyStimulusComposer.ts`), but the athlete
 * only needs one clear "why", not an internal audit trail. Returns
 * `undefined` for an unrecognised or absent code rather than ever showing
 * the raw identifier. */
export function explainReasonCode(reasonCodes: string[] | undefined): string | undefined {
  const code = reasonCodes?.[0]
  return code ? REASON_CODE_EXPLANATIONS[code] : undefined
}
