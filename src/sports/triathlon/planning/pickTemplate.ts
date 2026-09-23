import type { SessionType } from '@/core/training/PlannedSession'
import type { Discipline } from '@/shared/types/common'
import { getTemplatesByDiscipline, type SessionTemplate, type SessionTier } from '../sessions'

/**
 * When the preferred (phase-appropriate) session type doesn't fit the
 * day's available time, degrade towards an *easier* session rather than
 * whatever happens to match the remaining duration — a Sweet Spot session
 * that doesn't fit should fall back to an easy endurance spin, never to a
 * VO2max interval set just because it's the same length (brief §18: always
 * distinguish volume/intensity/specificity; a duration match is not an
 * intensity match).
 */
const EASY_FALLBACK_BY_DISCIPLINE: Partial<Record<Discipline, SessionType[]>> = {
  bike: ['endurance', 'recovery'],
  run: ['endurance', 'recovery'],
  swim: ['endurance', 'technique', 'recovery'],
  // A race-specific brick that doesn't fit the day's time degrades to the
  // shorter standard brick before the very different, low-value transition
  // drill (coaching defect found during Training Intelligence V2: the
  // preferred type used to always be the literal 'brick', so the
  // 'race-specific' brick template was unreachable by the generator at all
  // — see docs/coaching-methodology.md's defect log).
  brick: ['brick', 'transition'],
}

export interface PickTemplateOptions {
  /**
   * This week's load tier (see `progressionCurve.ts`) — lets a phase's
   * anchor session type genuinely evolve week to week (a lighter variant
   * on a deload week, a harder one on the block's peak week) instead of
   * generating the literal same session every time that type is picked.
   * Defaults to 'standard' when omitted (e.g. a manual session swap,
   * which isn't part of a phase's progression).
   */
  tier?: SessionTier
  /**
   * Deterministic seed (typically `weekIndexInPhase`) used to alternate
   * between several same-tier structural variants of the same session
   * type — real diversification instead of repeating the identical
   * session every time it's scheduled.
   */
  rotationKey?: number
}

/**
 * Below this, two fitting templates of the same type/tier are considered
 * genuine structural variants of comparable length (e.g. sweet-spot's
 * 55min/65min continuous-vs-split options) — `rotationKey` may freely
 * rotate between them. Above it, the gap is a *duration safety net*, not
 * a structural choice (e.g. bike-endurance's 40min/70min pair, added in
 * Training Intelligence V2.1 so a short day isn't forced all the way down
 * to a recovery spin) — rotation must never pick the far shorter one when
 * the longer one would fit, or it wastes the week's biggest, most
 * important days on a needlessly short session roughly one week in two.
 */
const STRUCTURAL_VARIANT_MARGIN_MIN = 15

/** Every template of `type` that fits, preferring `tier` and falling back
 * to the always-present 'standard' tier when nothing matches it. Prefers
 * the longest fitting duration by default — never leaves a big day
 * under-used — and only lets `rotationKey` rotate among templates within
 * `STRUCTURAL_VARIANT_MARGIN_MIN` of that longest one, so genuine
 * same-length structural variants still rotate for real diversification
 * (brief M2's "two structures, same charge") without a much shorter
 * duration-safety-net template ever winning by chance when it doesn't
 * need to. */
function matchType(
  candidates: SessionTemplate[],
  type: SessionType,
  maxMinutes: number,
  tier: SessionTier,
  rotationKey: number,
): SessionTemplate | undefined {
  const ofType = candidates.filter((t) => t.sessionType === type)
  const fits = (t: SessionTemplate) => t.estimatedDurationMin <= maxMinutes

  const tiersToTry = tier === 'standard' ? (['standard'] as const) : ([tier, 'standard'] as const)

  for (const wantedTier of tiersToTry) {
    const fitting = ofType
      .filter((t) => t.tier === wantedTier && fits(t))
      .sort((a, b) => b.estimatedDurationMin - a.estimatedDurationMin || a.id.localeCompare(b.id))
    if (fitting.length > 0) {
      const longest = fitting[0]!.estimatedDurationMin
      const topGroup = fitting.filter((t) => longest - t.estimatedDurationMin <= STRUCTURAL_VARIANT_MARGIN_MIN)
      return topGroup[((rotationKey % topGroup.length) + topGroup.length) % topGroup.length]
    }
  }
  return undefined
}

/**
 * Never schedules more than the day's declared availability (brief §49
 * invariant). Tries the preferred type first, then progressively easier
 * fallbacks for the same discipline, then the single shortest template of
 * that discipline as a last resort. Returns undefined if nothing fits at
 * all — the caller then leaves the slot empty rather than overshooting.
 */
export function pickBestFittingTemplate(
  discipline: Discipline,
  preferredType: SessionType | undefined,
  maxMinutes: number,
  options: PickTemplateOptions = {},
): SessionTemplate | undefined {
  const { tier = 'standard', rotationKey = 0 } = options
  const candidates = getTemplatesByDiscipline(discipline)
  const fits = (t: SessionTemplate) => t.estimatedDurationMin <= maxMinutes

  const typeChain = [preferredType, ...(EASY_FALLBACK_BY_DISCIPLINE[discipline] ?? [])].filter(
    (t): t is SessionType => t !== undefined,
  )

  for (const type of typeChain) {
    const match = matchType(candidates, type, maxMinutes, tier, rotationKey)
    if (match) return match
  }

  const shortest = [...candidates].sort((a, b) => a.estimatedDurationMin - b.estimatedDurationMin)[0]
  return shortest && fits(shortest) ? shortest : undefined
}
