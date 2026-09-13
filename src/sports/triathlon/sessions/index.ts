import type { Discipline } from '@/shared/types/common'
import { BIKE_SESSIONS } from './bikeSessions'
import { BRICK_SESSIONS } from './brickSessions'
import type { SessionTemplate } from './common'
import { MOBILITY_SESSIONS, STRENGTH_SESSIONS } from './strengthMobilitySessions'
import { RUN_SESSIONS } from './runSessions'
import { SWIM_SESSIONS } from './swimSessions'

export type { SessionTemplate, BlockTemplate } from './common'
export { instantiateSessionTemplate } from './common'

export const SESSION_CATALOG: SessionTemplate[] = [
  ...SWIM_SESSIONS,
  ...BIKE_SESSIONS,
  ...RUN_SESSIONS,
  ...STRENGTH_SESSIONS,
  ...MOBILITY_SESSIONS,
  ...BRICK_SESSIONS,
]

const BY_DISCIPLINE: Record<Discipline, SessionTemplate[]> = {
  swim: SWIM_SESSIONS,
  bike: BIKE_SESSIONS,
  run: RUN_SESSIONS,
  strength: STRENGTH_SESSIONS,
  mobility: MOBILITY_SESSIONS,
  brick: BRICK_SESSIONS,
}

export function getTemplatesByDiscipline(discipline: Discipline): SessionTemplate[] {
  return BY_DISCIPLINE[discipline]
}

export function getTemplateById(id: string): SessionTemplate | undefined {
  return SESSION_CATALOG.find((t) => t.id === id)
}
