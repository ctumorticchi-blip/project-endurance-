import { getAvailableMinutes, hasPoolAccess, type Availability } from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName, TrainingWeek } from '@/core/training/TrainingPlan'
import type { Discipline } from '@/shared/types/common'
import { instantiateSessionTemplate } from '../sessions'
import { pickBestFittingTemplate } from './pickTemplate'
import { PRIMARY_SESSION_TYPE_BY_PHASE, SECONDARY_SESSION_TYPE_BY_PHASE } from '@/sports/triathlon/coaching/weeklyStimulusComposer'

export interface SwapSessionContext {
  phase: TrainingPhaseName
  /** The session's own week, used to tell whether this would be the
   * discipline's anchor appearance or a secondary touch (same rule
   * buildWeekSessions uses when it first schedules the week). */
  week: TrainingWeek
  availability: Availability
}

/**
 * Replaces a planned session with a same-day, same-slot session of a
 * different discipline — "it's raining, I'll swim instead of riding
 * today" (brief feedback). Reuses the exact same template-picking and
 * type-selection logic the plan generator itself uses, so a swapped-in
 * session is never a worse fit for the day's time budget or the week's
 * training phase than a normally-generated one would be.
 *
 * Returns undefined when nothing fits — no pool access for a swim swap,
 * or no template of the target discipline short enough for the day's
 * available time — so the caller can show that plainly rather than
 * silently keeping the old session or overshooting the time budget.
 */
export function swapSessionDiscipline(
  session: PlannedSession,
  newDiscipline: Discipline,
  context: SwapSessionContext,
): PlannedSession | undefined {
  const { phase, week, availability } = context

  if (newDiscipline === session.discipline) return undefined

  const availableMinutes = getAvailableMinutes(availability, session.date)
  const maxMinutes = availableMinutes > 0 ? availableMinutes : session.plannedDurationMin

  if (newDiscipline === 'swim' && !hasPoolAccess(availability, session.date)) return undefined

  const occurrenceElsewhere = week.sessions.filter(
    (s) => s.id !== session.id && s.discipline === newDiscipline,
  ).length

  const preferredType =
    newDiscipline === 'bike' || newDiscipline === 'run' || newDiscipline === 'swim'
      ? (occurrenceElsewhere === 0 ? PRIMARY_SESSION_TYPE_BY_PHASE : SECONDARY_SESSION_TYPE_BY_PHASE)[phase][
          newDiscipline
        ]
      : newDiscipline === 'brick'
        ? 'brick'
        : undefined

  const template = pickBestFittingTemplate(newDiscipline, preferredType, maxMinutes)
  if (!template) return undefined

  const instantiated = instantiateSessionTemplate(template, {
    date: session.date,
    weekId: session.weekId,
    priority: session.priority,
  })

  // Keep the original session's id: replaceSessionInPlan matches by id to
  // find which session to overwrite, and instantiateSessionTemplate always
  // mints a fresh one — without this override the swap would silently be
  // a no-op (nothing in the plan has that new id to replace).
  return { ...instantiated, id: session.id }
}

/** Disciplines an athlete can manually swap to — never brick (a composite
 * bike+run structure, not a simple single-discipline substitute). */
export const SWAPPABLE_DISCIPLINES: Discipline[] = ['swim', 'bike', 'run', 'strength', 'mobility']
