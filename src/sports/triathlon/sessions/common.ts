import type { SessionPriority } from '@/core/training/PlannedSession'
import type { SessionType } from '@/core/training/PlannedSession'
import type { Discipline } from '@/shared/types/common'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import { createPlannedSession, type PlannedSession } from '@/core/training/PlannedSession'
import type { DateISO } from '@/shared/types/common'

export const SEC_PER_MIN = 60

export function minutesToSec(minutes: number): number {
  return minutes * SEC_PER_MIN
}

/** Named RPE bands so no block ever hardcodes a bare number pair. */
export const RPE_RANGE = {
  recovery: [1, 3] as [number, number],
  easy: [2, 4] as [number, number],
  endurance: [3, 5] as [number, number],
  tempo: [5, 6] as [number, number],
  sweetSpot: [6, 7] as [number, number],
  threshold: [7, 8] as [number, number],
  vo2max: [8, 9] as [number, number],
}

export type BlockTemplate = Omit<WorkoutBlock, 'id'>

export function warmupBlock(durationMin: number, label = 'Échauffement'): BlockTemplate {
  return {
    label,
    durationSec: minutesToSec(durationMin),
    targetZone: 'Z1',
    targetRpeMin: RPE_RANGE.easy[0],
    targetRpeMax: RPE_RANGE.easy[1],
  }
}

export function cooldownBlock(durationMin: number, label = 'Retour au calme'): BlockTemplate {
  return {
    label,
    durationSec: minutesToSec(durationMin),
    targetZone: 'Z1',
    targetRpeMin: RPE_RANGE.recovery[0],
    targetRpeMax: RPE_RANGE.recovery[1],
  }
}

/**
 * Where a template sits on its (discipline, sessionType)'s load ladder —
 * lets the generator express real week-to-week progression and periodic
 * deload without inventing a continuous, falsely-precise scaling formula:
 * every step is a literal, authored, inspectable session. `standard` is
 * the everyday version; `reduced`/`minimal` are lighter (deload weeks,
 * taper); `peak` is the hardest version of that same session type, used
 * on a phase's toughest week. Not every (discipline, sessionType) has all
 * four — only the types actually used as a phase's anchor (`key`) session
 * need the full ladder (see `sports/triathlon/planning/progressionCurve.ts`).
 */
export type SessionTier = 'minimal' | 'reduced' | 'standard' | 'peak'

export interface SessionTemplate {
  id: string
  discipline: Discipline
  sessionType: SessionType
  tier: SessionTier
  title: string
  objective: string
  blocks: BlockTemplate[]
  estimatedDurationMin: number
  defaultPriority: SessionPriority
}

/** Turns a catalog template into a concrete, dated `PlannedSession` — the
 * only place block/session ids are minted for real plan instances. */
export function instantiateSessionTemplate(
  template: SessionTemplate,
  options: {
    date: DateISO
    weekId: string
    priority?: SessionPriority
    familyId?: string
    reasonCodes?: string[]
  },
): PlannedSession {
  return createPlannedSession({
    discipline: template.discipline,
    sessionType: template.sessionType,
    title: template.title,
    objective: template.objective,
    estimatedDurationMin: template.estimatedDurationMin,
    priority: options.priority ?? template.defaultPriority,
    date: options.date,
    weekId: options.weekId,
    blocks: template.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    familyId: options.familyId,
    reasonCodes: options.reasonCodes,
  })
}
