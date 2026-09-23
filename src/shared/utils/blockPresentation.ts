import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import type { Discipline } from '@/shared/types/common'

export type BlockRole = 'warmup' | 'main' | 'cooldown'

/**
 * Infers warmup/main/cooldown purely from label text (Coaching Experience
 * V1 brief §17: "where the session data supports it"). Every catalog
 * warm-up/cool-down block is authored via the shared `warmupBlock()`/
 * `cooldownBlock()` helpers (`sports/triathlon/sessions/common.ts`), which
 * default to exactly these two French labels unless a template overrides
 * them — a presentation-layer heuristic on existing authored text, not a
 * new coaching decision or a new schema field. Sessions without a
 * matching block (technique work, strength, most swim sets) simply render
 * with no section grouping at all; that's the honest outcome, not a bug.
 */
export function inferBlockRole(block: WorkoutBlock): BlockRole {
  const label = block.label.toLowerCase()
  if (label.includes('échauffement') || label.includes('echauffement')) return 'warmup'
  if (label.includes('retour au calme')) return 'cooldown'
  return 'main'
}

/** True once at least one block in the session actually has a distinct
 * warm-up or cool-down — otherwise grouping would just wrap every block
 * in a single "Bloc principal" heading, adding noise instead of clarity. */
export function hasStructuredSections(blocks: WorkoutBlock[]): boolean {
  return blocks.some((b) => inferBlockRole(b) !== 'main')
}

export type BrickLeg = Discipline | 'transition'

/**
 * A brick session (`discipline: 'brick'`) has no per-block discipline
 * field (`PlannedSession`/`WorkoutBlock` — see `docs/coaching-experience.md`
 * for why this stays a label heuristic rather than a new schema field: the
 * brick catalog's block labels are consistently authored in French as
 * "Vélo …" / "Course …" / "Transition …", brief §48). Falls back to
 * `undefined` for a label that doesn't match rather than guessing.
 */
export function inferBrickLeg(block: WorkoutBlock): BrickLeg | undefined {
  const label = block.label.toLowerCase()
  if (label.includes('vélo') || label.includes('velo')) return 'bike'
  if (label.includes('course')) return 'run'
  if (label.includes('nage') || label.includes('natation')) return 'swim'
  if (label.includes('transition')) return 'transition'
  return undefined
}
