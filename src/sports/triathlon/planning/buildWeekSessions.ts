import {
  getAvailableMinutes,
  hasPoolAccess,
  resolveDesiredRestDays,
  type Availability,
} from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { DateISO, Discipline } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { instantiateSessionTemplate } from '../sessions'
import { pickBestFittingTemplate } from './pickTemplate'
import {
  applyBrickInsertion,
  PRIMARY_SESSION_TYPE_BY_PHASE,
  SECONDARY_SESSION_TYPE_BY_PHASE,
  shouldInsertBrick,
  WEEKLY_SLOT_DISCIPLINES,
  WEEKLY_SLOT_PRIORITIES,
} from './weeklySlots'

export interface BuildWeekSessionsInput {
  weekStart: DateISO
  /** Days on/after this date are excluded — keeps sessions from ever landing on or after the race. */
  planEndDateExclusive: DateISO
  phase: TrainingPhaseName
  weekIndexInPhase: number
  weekId: string
  availability: Availability
}

/** Below this, a "session" would be too short to be worth prescribing. */
const MIN_VIABLE_SESSION_MINUTES = 15

export function buildWeekSessions(input: BuildWeekSessionsInput): PlannedSession[] {
  const { weekStart, planEndDateExclusive, phase, weekIndexInPhase, weekId, availability } = input

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (date) => date < planEndDateExclusive,
  )

  // At least one rest day per week, always — even if every day is marked
  // available with enough minutes. Days are already sorted by most
  // available minutes first, so capping the count here simply drops the
  // day(s) with the least time, leaving them unscheduled (a rest day).
  const restDaysPerWeek = resolveDesiredRestDays(availability)
  const maxTrainingDays = Math.max(0, weekDates.length - restDaysPerWeek)

  const daysWithMinutes = weekDates
    .map((date) => ({
      date,
      minutes: getAvailableMinutes(availability, date),
      pool: hasPoolAccess(availability, date),
    }))
    .filter((d) => d.minutes >= MIN_VIABLE_SESSION_MINUTES)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, maxTrainingDays)

  const numDays = daysWithMinutes.length
  let disciplines: Discipline[] = WEEKLY_SLOT_DISCIPLINES[Math.min(numDays, 7)] ?? []

  if (shouldInsertBrick(phase, weekIndexInPhase, numDays)) {
    disciplines = applyBrickInsertion(disciplines)
  }

  // How many times each discipline has already been *assigned a session*
  // so far this week — read before, and updated after, each slot decision,
  // so "occurrence 0" reliably means "this discipline's anchor session".
  const occurrenceByDiscipline = new Map<Discipline, number>()
  const usedDates = new Set<string>()
  const sessions: PlannedSession[] = []

  for (let slot = 0; slot < disciplines.length; slot++) {
    const discipline = disciplines[slot]!
    const priority = WEEKLY_SLOT_PRIORITIES[slot] ?? 'optional'

    let day = daysWithMinutes[slot]
    let effectiveDiscipline: Discipline = discipline
    let effectiveOccurrence = occurrenceByDiscipline.get(discipline) ?? 0

    if (discipline === 'swim' && (!day || !day.pool)) {
      const poolDay = daysWithMinutes.find((d) => d.pool && !usedDates.has(d.date))
      if (poolDay) {
        day = poolDay
      } else if (day && !usedDates.has(day.date)) {
        // No pool access anywhere this week: don't waste this day's time —
        // give it to whichever of bike/run has had the fewer sessions so far.
        const bikeCount = occurrenceByDiscipline.get('bike') ?? 0
        const runCount = occurrenceByDiscipline.get('run') ?? 0
        effectiveDiscipline = runCount <= bikeCount ? 'run' : 'bike'
        effectiveOccurrence = runCount <= bikeCount ? runCount : bikeCount
      }
    }

    if (!day || usedDates.has(day.date)) continue
    usedDates.add(day.date)
    occurrenceByDiscipline.set(effectiveDiscipline, effectiveOccurrence + 1)

    const preferredType =
      effectiveDiscipline === 'bike' || effectiveDiscipline === 'run' || effectiveDiscipline === 'swim'
        ? (effectiveOccurrence === 0 ? PRIMARY_SESSION_TYPE_BY_PHASE : SECONDARY_SESSION_TYPE_BY_PHASE)[
            phase
          ][effectiveDiscipline]
        : effectiveDiscipline === 'brick'
          ? 'brick'
          : undefined

    const template = pickBestFittingTemplate(effectiveDiscipline, preferredType, day.minutes)
    if (!template) continue

    // A slot only earns "key" if it actually delivers the anchor stimulus.
    // When time constraints degraded it all the way to a recovery-tier
    // session, calling it "key" would contradict the explanation shown to
    // the athlete (brief §51: cohérence sportive first).
    const effectivePriority =
      priority === 'key' && template.sessionType === 'recovery' ? 'secondary' : priority

    sessions.push(
      instantiateSessionTemplate(template, { date: day.date, weekId, priority: effectivePriority }),
    )
  }

  return sessions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
