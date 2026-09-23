/**
 * Every major Training Intelligence rule is tagged with how strongly it is
 * grounded, so the product never claims scientific certainty it doesn't
 * have (brief §1 / product-vision.md "pas de fausse science"):
 *
 * - `EVIDENCE_BASED` — supported reasonably by exercise-science literature
 *   or a strong, widely-accepted physiological principle (e.g. progressive
 *   overload, specificity, the existence of a lactate/ventilatory
 *   threshold as a training-zone anchor).
 * - `COACHING_HEURISTIC` — widely used in real coaching practice, but the
 *   evidence is incomplete, context-dependent, or the exact numbers vary
 *   by coach/program (e.g. a 4-week build/build/peak/deload microcycle, an
 *   80/20-ish polarized intensity split, "cruise intervals" for threshold
 *   work instead of a continuous effort).
 * - `PRODUCT_RULE` — a deterministic rule Project Endurance introduces for
 *   usability, consistency, or safety, not a claim about physiology (e.g.
 *   "never schedule two KEY_A sessions on consecutive days", "a session
 *   below 5 minutes doesn't get prescribed", the specific RPE thresholds
 *   used to trigger a decision).
 *
 * See `docs/coaching-methodology.md` for the classification of every major
 * rule in the engine. This type exists so new code can carry the tag next
 * to the rule itself (`WorkoutFamily.evidenceClassification`,
 * `ProgressionResponse` reasoning) rather than only in prose.
 */
export type EvidenceClassification = 'EVIDENCE_BASED' | 'COACHING_HEURISTIC' | 'PRODUCT_RULE'
