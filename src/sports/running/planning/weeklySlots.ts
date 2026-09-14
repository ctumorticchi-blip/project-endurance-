import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { SessionPriority, SessionType } from '@/core/training/PlannedSession'
import type { Discipline } from '@/shared/types/common'
import type { SessionTier } from '@/sports/triathlon/sessions/common'

/**
 * Running's own weekly-slot roles. Unlike triathlon (where each discipline
 * usually appears at most twice a week), a runner's week is almost
 * entirely `run` sessions — so the role that matters is *which* run each
 * day is, not which discipline. Every real methodology cited in this
 * rollout (Daniels, Pfitzinger, Hansons, Higdon) converges on the same
 * skeleton: one long run, one-or-two "quality" (harder) sessions, the rest
 * easy — so that's what this table encodes, ordered by the day with the
 * *most* available minutes down to the least (the long run and the main
 * quality session need the two biggest windows). Strength/mobility only
 * appear once every running day is covered, same rule as triathlon's
 * compléments.
 */
export type RunningSlotRole = 'long' | 'quality' | 'quality2' | 'easy' | 'strength' | 'mobility'

export const WEEKLY_SLOT_ROLES: Record<number, RunningSlotRole[]> = {
  0: [],
  1: ['long'],
  2: ['long', 'quality'],
  3: ['long', 'quality', 'easy'],
  4: ['long', 'quality', 'easy', 'easy'],
  5: ['long', 'quality', 'quality2', 'easy', 'easy'],
  6: ['long', 'quality', 'quality2', 'easy', 'easy', 'strength'],
  7: ['long', 'quality', 'quality2', 'easy', 'easy', 'strength', 'mobility'],
}

const ROLE_DISCIPLINE: Record<RunningSlotRole, Discipline> = {
  long: 'run',
  quality: 'run',
  quality2: 'run',
  easy: 'run',
  strength: 'strength',
  mobility: 'mobility',
}

export function disciplineForRole(role: RunningSlotRole): Discipline {
  return ROLE_DISCIPLINE[role]
}

const ROLE_PRIORITY: Record<RunningSlotRole, SessionPriority> = {
  long: 'key',
  quality: 'key',
  quality2: 'secondary',
  easy: 'secondary',
  strength: 'optional',
  mobility: 'optional',
}

export function priorityForRole(role: RunningSlotRole): SessionPriority {
  return ROLE_PRIORITY[role]
}

/**
 * The main quality session's type by phase — the same aerobic-base-first
 * progression Pfitzinger and Daniels both describe: no structured hard
 * work in base (Lydiard's rule), threshold work as the build phase's
 * focus, VO2max/race-specific work once in the specific phase, and a
 * light tempo touch through taper to keep contact with race rhythm
 * without adding fatigue.
 */
export const QUALITY_TYPE_BY_PHASE: Record<TrainingPhaseName, SessionType> = {
  base: 'endurance',
  build: 'threshold',
  specific: 'intervals',
  taper: 'tempo',
  race: 'recovery',
}

/**
 * The second quality session's *calm* default (a non-rotating week: base,
 * taper, race, or a deload/very-light week anywhere) — always one notch
 * easier than the main quality session so the week never doubles up on
 * hard stimulus.
 */
const QUALITY2_CALM_DEFAULT: Record<TrainingPhaseName, SessionType> = {
  base: 'endurance',
  build: 'tempo',
  specific: 'threshold',
  taper: 'endurance',
  race: 'recovery',
}

/**
 * Build/specific rotation for the second quality session on a
 * normal-or-harder week — real variety instead of the same secondary touch
 * every week: build alternates a tempo touch with a threshold repeat and a
 * calm endurance week; specific rotates race-pace work, threshold, and
 * VO2max so all three race-specific stimuli actually get used across a
 * training block (Canova: vary the specific-work format rather than
 * repeating one session type).
 */
const BUILD_SPECIFIC_QUALITY2_ROTATION: Record<'build' | 'specific', SessionType[]> = {
  build: ['tempo', 'endurance', 'threshold', 'endurance'],
  specific: ['race-specific', 'threshold', 'intervals', 'race-specific'],
}

/**
 * Picks the second quality session's type. On a deload/very-light week
 * (`reduced`/`minimal` tier) the rotation is skipped in favour of the calm
 * default — a deload week should reduce both volume *and* intensity, not
 * add a sharpening touch.
 */
export function getQuality2Type(
  phase: TrainingPhaseName,
  weekIndexInPhase: number,
  tier: SessionTier,
): SessionType {
  const calmDefault = QUALITY2_CALM_DEFAULT[phase]
  const isRotationEligible = (phase === 'build' || phase === 'specific') && tier !== 'reduced' && tier !== 'minimal'
  if (!isRotationEligible) return calmDefault

  const rotation = BUILD_SPECIFIC_QUALITY2_ROTATION[phase]
  return rotation[weekIndexInPhase % rotation.length]!
}
