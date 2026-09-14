import type { SessionType } from '@/core/training/PlannedSession'
import type { Discipline } from '@/shared/types/common'
import type { SessionTemplate, SessionTier } from '@/sports/triathlon/sessions/common'
import { getTemplatesByDiscipline } from '../sessions'

/**
 * Running's own copy of triathlon's `pickTemplate.ts` matching algorithm —
 * deliberately duplicated rather than sharing an injected-candidates
 * refactor of the triathlon version, to keep this milestone's risk to the
 * already-shipped, fully-tested triathlon planner at zero (see RUN-1/RUN-3
 * commit messages). If the two ever drift in behavior, that's an explicit,
 * inspectable divergence, not a bug — running's fallback chain and easy
 * degradation table only ever reference running's own catalog.
 */
const EASY_FALLBACK_BY_DISCIPLINE: Partial<Record<Discipline, SessionType[]>> = {
  run: ['endurance', 'recovery'],
}

export interface PickTemplateOptions {
  tier?: SessionTier
  rotationKey?: number
}

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
      .sort((a, b) => a.id.localeCompare(b.id))
    if (fitting.length > 0) {
      return fitting[((rotationKey % fitting.length) + fitting.length) % fitting.length]
    }
  }
  return undefined
}

/**
 * Never schedules more than the day's declared availability. Tries the
 * preferred type first, then progressively easier fallbacks for the same
 * discipline, then the single shortest template of that discipline as a
 * last resort. Returns undefined if nothing fits at all.
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
