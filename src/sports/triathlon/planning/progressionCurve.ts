import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { SessionTier } from '@/sports/triathlon/sessions/common'

/**
 * Classic block-periodization microcycle: a few progressively harder weeks
 * followed by a lighter "deload" week that lets the body absorb the load
 * before the next block — a well-established pattern in endurance
 * coaching (not something derived per-athlete). The numbers are a coarse,
 * documented heuristic, not a physiological model (brief "pas de fausse
 * science"): they only ever bias *which authored template variant* gets
 * picked (see `getSessionTier`) — they never override a day's declared
 * availability, which stays the hard ceiling everywhere downstream.
 *
 * Each phase cycles through its own 4-week pattern (peak week third,
 * deload week last) regardless of how many weeks the phase actually gets —
 * a 2-week phase just never reaches the deload/peak entries, which is the
 * safe outcome for a short block.
 */
const BUILD_CYCLE_LOAD: Record<'base' | 'build' | 'specific', number[]> = {
  base: [0.85, 0.95, 1.05, 0.68],
  build: [0.88, 1.0, 1.15, 0.72],
  specific: [0.9, 1.02, 1.2, 0.75],
}

/**
 * Taper/race weeks never cycle: load must descend monotonically toward the
 * race so the last training stimulus before the start line is always the
 * lightest one — whatever the taper's actual length ends up being (1 week
 * for a Sprint, 2 for an "M", or more if a short runway forced extra weeks
 * into taper as a safety fallback, see `phaseAllocation.ts`).
 */
function taperLoadMultiplier(weekIndexInPhase: number, weeksInPhase: number): number {
  if (weeksInPhase <= 1) return 0.5
  const progress = weekIndexInPhase / (weeksInPhase - 1) // 0 = furthest from race, 1 = race week
  return 0.8 - 0.35 * progress
}

/** A single light week for the race phase itself (openers, not training load). */
const RACE_WEEK_LOAD = 0.4

export function getWeekLoadMultiplier(
  phase: TrainingPhaseName,
  weekIndexInPhase: number,
  weeksInPhase: number,
): number {
  if (phase === 'race') return RACE_WEEK_LOAD
  if (phase === 'taper') return taperLoadMultiplier(weekIndexInPhase, weeksInPhase)
  const cycle = BUILD_CYCLE_LOAD[phase]
  return cycle[weekIndexInPhase % cycle.length]!
}

/**
 * Maps a continuous multiplier to one of the four authored tiers
 * (`sports/triathlon/sessions/common.ts`). Coarse buckets on purpose —
 * two different multipliers landing on the same tier just means the
 * catalog doesn't (yet) distinguish them, which is the honest outcome
 * given every tier is a literal, inspectable session rather than a
 * runtime-scaled number.
 */
export function getSessionTier(multiplier: number): SessionTier {
  if (multiplier <= 0.55) return 'minimal'
  if (multiplier <= 0.8) return 'reduced'
  if (multiplier <= 1.0) return 'standard'
  return 'peak'
}
