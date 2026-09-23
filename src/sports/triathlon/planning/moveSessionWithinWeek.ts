import { getAvailableMinutes, hasPoolAccess, type Availability } from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName, TrainingWeek } from '@/core/training/TrainingPlan'
import type { DateISO } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { instantiateSessionTemplate } from '../sessions'
import { pickBestFittingTemplate } from './pickTemplate'
import { PRIMARY_SESSION_TYPE_BY_PHASE, SECONDARY_SESSION_TYPE_BY_PHASE } from '@/sports/triathlon/coaching/weeklyStimulusComposer'

/** Below this, a "session" would be too short to be worth prescribing —
 * same threshold `buildWeekSessions.ts` and `pickTemplate.ts` already use. */
const MIN_VIABLE_SESSION_MINUTES = 15

export interface MoveCandidateDay {
  date: DateISO
  minutes: number
}

/**
 * Other days within `session`'s own week that could realistically host it
 * if it's moved rather than just dropped: not the session's own date, not
 * already carrying another session, enough declared time, pool access
 * when the discipline needs it, and strictly before the race.
 */
export function findMoveCandidateDays(
  session: PlannedSession,
  week: TrainingWeek,
  availability: Availability,
  planEndDateExclusive: DateISO,
): MoveCandidateDay[] {
  const usedDates = new Set(week.sessions.filter((s) => s.id !== session.id).map((s) => s.date))

  return Array.from({ length: 7 }, (_, i) => addDays(week.startDate, i))
    .filter((date) => date < planEndDateExclusive && date !== session.date && !usedDates.has(date))
    .map((date) => ({ date, minutes: getAvailableMinutes(availability, date) }))
    .filter((d) => d.minutes >= MIN_VIABLE_SESSION_MINUTES)
    .filter((d) => session.discipline !== 'swim' || hasPoolAccess(availability, d.date))
}

/**
 * Recreates `session` on `targetDate` — same discipline, same
 * anchor-vs-secondary type it originally had — sized to fit that day's
 * declared time. Mirrors `swapSessionDiscipline.ts`'s own type-selection
 * logic so a moved session is never a worse fit than a normally-generated
 * one. Returns undefined if nothing of that discipline fits at all
 * (caller should not have offered this date per `findMoveCandidateDays`,
 * but this stays safe on its own regardless).
 */
export function moveSessionToDay(
  session: PlannedSession,
  targetDate: DateISO,
  context: { phase: TrainingPhaseName; week: TrainingWeek; availability: Availability },
): PlannedSession | undefined {
  const { phase, week, availability } = context
  const maxMinutes = getAvailableMinutes(availability, targetDate)
  if (session.discipline === 'swim' && !hasPoolAccess(availability, targetDate)) return undefined

  const occurrenceElsewhere = week.sessions.filter(
    (s) => s.id !== session.id && s.discipline === session.discipline,
  ).length

  const preferredType =
    session.discipline === 'bike' || session.discipline === 'run' || session.discipline === 'swim'
      ? (occurrenceElsewhere === 0 ? PRIMARY_SESSION_TYPE_BY_PHASE : SECONDARY_SESSION_TYPE_BY_PHASE)[phase][
          session.discipline
        ]
      : session.discipline === 'brick'
        ? 'brick'
        : undefined

  const template = pickBestFittingTemplate(session.discipline, preferredType, maxMinutes)
  if (!template) return undefined

  return instantiateSessionTemplate(template, {
    date: targetDate,
    weekId: session.weekId,
    priority: session.priority,
  })
}
