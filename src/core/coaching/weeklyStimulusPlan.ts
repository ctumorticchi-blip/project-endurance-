import type { StimulusPriority } from './stimulusPriority'
import type { Discipline } from '@/shared/types/common'

/**
 * The role a stimulus plays in the week's overall composition (brief §8) —
 * decided *before* any individual workout is selected or placed on a day.
 * A week is built from these roles first; `buildWeekSessions.ts` then picks
 * a concrete `SessionTemplate` for each requirement and places it.
 */
export type StimulusRole =
  | 'primary'
  | 'secondary'
  | 'development'
  | 'aerobicSupport'
  | 'specificity'
  | 'strength'

export interface StimulusRequirement {
  role: StimulusRole
  discipline: Discipline
  /** The `WorkoutFamily.id` this requirement should be filled with. */
  familyId: string
  priority: StimulusPriority
  /** Athlete-facing "why this" — assembled into the week's explanation. */
  rationale: string
}

/**
 * The Weekly Stimulus Composer's output — "what training stimuli does this
 * athlete need this week", decided from phase + limiter analysis +
 * progression state + recent fatigue, before any calendar placement
 * happens (brief §8, §23). Triathlon's concrete composer lives in
 * `sports/triathlon/coaching/weeklyStimulusComposer.ts`; this shape is
 * sport-agnostic so a future single-discipline sport's composer (a much
 * simpler case — no cross-discipline allocation) can reuse it too.
 */
export interface WeeklyStimulusPlan {
  requirements: StimulusRequirement[]
  /** The athlete-facing "why does my program look like this" explanation
   * for the week as a whole (brief §38, §53). */
  weeklyPurposeExplanation: string
}
