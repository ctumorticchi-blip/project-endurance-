import type { SessionType } from '@/core/training/PlannedSession'
import type { DisciplineStrengthAnalysis } from './limiterAnalysis'

type EnduranceDiscipline = 'bike' | 'run' | 'swim'

/**
 * The build/specific secondary-touch rotation every athlete gets today,
 * regardless of their own strengths and weaknesses — the exact gap the
 * audit flagged: `disciplineLevels` exists on `AthleteProfile` but nothing
 * in the plan generator ever reads it. Kept here (not just in
 * `weeklySlots.ts`) as the *generic* default so the limiter-adjusted
 * rotations below can be defined as an explicit deviation from it.
 */
const GENERIC_ROTATION: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'long', 'vo2max', 'endurance'],
  run: ['endurance', 'long', 'intervals', 'endurance'],
  swim: ['technique', 'endurance', 'intervals', 'endurance'],
}

/**
 * A weak discipline benefits more from targeted technical/development work
 * than from more volume or, worse, top-end intensity it isn't ready to
 * absorb specifically (brief §19: "weak swimmers should often receive
 * proportionally more technical work rather than simply more volume" —
 * generalized here to bike/run too). Replaces the generic rotation's
 * top-end entry (vo2max/intervals) with a second technique/development
 * touch instead. COACHING_HEURISTIC.
 */
const LIMITER_DEVELOPMENT_ROTATION: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'technique', 'endurance', 'tempo'],
  run: ['endurance', 'technique', 'endurance', 'tempo'],
  swim: ['technique', 'endurance', 'technique', 'css'],
}

/**
 * The athlete's strongest discipline is maintained, not developed further
 * at disproportionate time cost (brief §18's "produce the appropriate bike
 * performance without destroying the run", generalized to every
 * discipline, and success criterion #2). Its secondary touches drop the
 * rotation's long/top-end entries entirely and stay at an easy/maintenance
 * default. COACHING_HEURISTIC.
 */
const STRENGTH_MAINTENANCE_ROTATION: Record<EnduranceDiscipline, SessionType[]> = {
  bike: ['endurance', 'endurance', 'recovery', 'endurance'],
  run: ['endurance', 'endurance', 'recovery', 'endurance'],
  swim: ['endurance', 'endurance', 'recovery', 'endurance'],
}

/**
 * Resolves the build/specific secondary-touch rotation for one discipline,
 * biased by the athlete's own limiter analysis — the mechanism that makes
 * two athletes preparing the same race receive meaningfully different
 * programs (brief success criterion #1) instead of the same generic
 * rotation regardless of who is actually weak where.
 *
 * A *balanced* athlete (no limiter/strongest distinction — see
 * `limiterAnalysis.isBalanced`) gets the generic rotation for every
 * discipline, same as today — there is nothing to bias toward without a
 * real gap between disciplines.
 */
export function getLimiterAdjustedRotation(
  discipline: EnduranceDiscipline,
  limiterAnalysis: DisciplineStrengthAnalysis,
): SessionType[] {
  if (limiterAnalysis.isBalanced) return GENERIC_ROTATION[discipline]
  if (discipline === limiterAnalysis.limiter) return LIMITER_DEVELOPMENT_ROTATION[discipline]
  if (discipline === limiterAnalysis.strongest) return STRENGTH_MAINTENANCE_ROTATION[discipline]
  return GENERIC_ROTATION[discipline]
}
