import type { Discipline } from '@/shared/types/common'
import { MOBILITY_SESSIONS } from '@/sports/triathlon/sessions/strengthMobilitySessions'
import type { SessionTemplate } from '@/sports/triathlon/sessions/common'
import { RUNNING_SESSIONS } from './runningSessions'

export type { SessionTemplate, BlockTemplate, SessionTier } from '@/sports/triathlon/sessions/common'
export { instantiateSessionTemplate } from '@/sports/triathlon/sessions/common'

/**
 * Running's own catalog — reuses the sport-agnostic mobility templates
 * directly from the triathlon catalog (general joint-mobility work isn't
 * sport-specific) but authors its own run and strength templates in
 * `runningSessions.ts`, since those need to speak to a runner's actual
 * training paces and injury profile rather than a triathlete's.
 */
export const SESSION_CATALOG: SessionTemplate[] = [...RUNNING_SESSIONS, ...MOBILITY_SESSIONS]

const BY_DISCIPLINE: Partial<Record<Discipline, SessionTemplate[]>> = {
  run: RUNNING_SESSIONS.filter((t) => t.discipline === 'run'),
  strength: RUNNING_SESSIONS.filter((t) => t.discipline === 'strength'),
  mobility: MOBILITY_SESSIONS,
}

export function getTemplatesByDiscipline(discipline: Discipline): SessionTemplate[] {
  return BY_DISCIPLINE[discipline] ?? []
}

export function getTemplateById(id: string): SessionTemplate | undefined {
  return SESSION_CATALOG.find((t) => t.id === id)
}
