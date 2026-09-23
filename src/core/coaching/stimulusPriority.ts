/**
 * A richer session-importance hierarchy than `PlannedSession.priority`
 * (`'key' | 'secondary' | 'optional'`), used internally by the Weekly
 * Stimulus Composer and the Athlete Response Engine to decide what to
 * protect first when life gets in the way (brief §22). It is deliberately
 * a *superset distinction*, not a replacement: every `StimulusPriority`
 * maps down to exactly one `PlannedSession['priority']` for calendar
 * placement and the existing UI (`toSessionPriority` below), so nothing
 * that already reads `session.priority` needs to change.
 *
 * - `KEY_A` — the single most important stimulus of the week for the
 *   current phase (e.g. the block's anchor long ride, or the primary
 *   limiter-development session). At most one or two per week.
 * - `KEY_B` — an important secondary stimulus, protected but with more
 *   room to move than KEY_A if life intervenes.
 * - `SUPPORT` — a real, purposeful touch (a second easy run, a technique
 *   swim) that helps but isn't decisive on its own.
 * - `EASY` — aerobic filler, the first thing trimmed under time pressure.
 * - `RECOVERY` — deliberately low-cost, protects recovery rather than
 *   fitness.
 * - `OPTIONAL` — nice-to-have (extra mobility), dropped without
 *   consequence.
 *
 * PRODUCT_RULE: the 6-level hierarchy and its mapping to the 3-level
 * `PlannedSession.priority` are a Project Endurance usability decision,
 * not a physiological claim.
 */
export type StimulusPriority = 'KEY_A' | 'KEY_B' | 'SUPPORT' | 'EASY' | 'RECOVERY' | 'OPTIONAL'

const SESSION_PRIORITY_BY_STIMULUS: Record<StimulusPriority, 'key' | 'secondary' | 'optional'> = {
  KEY_A: 'key',
  KEY_B: 'key',
  SUPPORT: 'secondary',
  EASY: 'secondary',
  RECOVERY: 'optional',
  OPTIONAL: 'optional',
}

/** The one place that narrows a `StimulusPriority` down to the 3-level
 * `PlannedSession['priority']` every existing screen and the adaptation
 * engine already understand. */
export function toSessionPriority(stimulusPriority: StimulusPriority): 'key' | 'secondary' | 'optional' {
  return SESSION_PRIORITY_BY_STIMULUS[stimulusPriority]
}

/** Ordered most- to least-protected — used when a week must shed load and
 * needs to know which stimuli go first. */
export const STIMULUS_PRIORITY_ORDER: StimulusPriority[] = [
  'KEY_A',
  'KEY_B',
  'SUPPORT',
  'EASY',
  'RECOVERY',
  'OPTIONAL',
]
