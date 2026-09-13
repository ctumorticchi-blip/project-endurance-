import type { SessionType } from '@/core/training/PlannedSession'
import type { Discipline } from '@/shared/types/common'
import { getTemplatesByDiscipline, type SessionTemplate } from '../sessions'

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
  brick: ['transition'],
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
): SessionTemplate | undefined {
  const candidates = getTemplatesByDiscipline(discipline)
  const fits = (t: SessionTemplate) => t.estimatedDurationMin <= maxMinutes

  const typeChain = [preferredType, ...(EASY_FALLBACK_BY_DISCIPLINE[discipline] ?? [])].filter(
    (t): t is SessionType => t !== undefined,
  )

  for (const type of typeChain) {
    const match = candidates.find((t) => t.sessionType === type && fits(t))
    if (match) return match
  }

  const shortest = [...candidates].sort((a, b) => a.estimatedDurationMin - b.estimatedDurationMin)[0]
  return shortest && fits(shortest) ? shortest : undefined
}
