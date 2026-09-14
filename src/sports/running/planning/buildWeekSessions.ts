import {
  getAvailableMinutes,
  resolveDesiredRestDays,
  resolveRestDates,
  type Availability,
} from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { DateISO } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { getSessionTier, getWeekLoadMultiplier } from '@/sports/triathlon/planning/progressionCurve'
import { instantiateSessionTemplate } from '../sessions'
import { pickBestFittingTemplate } from './pickTemplate'
import {
  disciplineForRole,
  getQuality2Type,
  priorityForRole,
  QUALITY_TYPE_BY_PHASE,
  WEEKLY_SLOT_ROLES,
} from './weeklySlots'

export interface BuildWeekSessionsInput {
  weekStart: DateISO
  /** Days on/after this date are excluded — keeps sessions from ever landing on or after the race. */
  planEndDateExclusive: DateISO
  phase: TrainingPhaseName
  weekIndexInPhase: number
  /** How many weeks this phase spans in total — drives the load curve
   * (progressive overload + deload cycle within a phase, descending taper).
   * Defaults to a full 4-week cycle when omitted. */
  weeksInPhase?: number
  weekId: string
  availability: Availability
}

/** Below this, a "session" would be too short to be worth prescribing. */
const MIN_VIABLE_SESSION_MINUTES = 15

export function buildWeekSessions(input: BuildWeekSessionsInput): PlannedSession[] {
  const {
    weekStart,
    planEndDateExclusive,
    phase,
    weekIndexInPhase,
    weeksInPhase = 4,
    weekId,
    availability,
  } = input

  const loadMultiplier = getWeekLoadMultiplier(phase, weekIndexInPhase, weeksInPhase)
  const tier = getSessionTier(loadMultiplier)

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (date) => date < planEndDateExclusive,
  )

  const explicitRestDates = resolveRestDates(availability, weekDates)
  const restDaysPerWeek =
    explicitRestDates.size > 0 ? explicitRestDates.size : resolveDesiredRestDays(availability)
  const maxTrainingDays = Math.max(0, weekDates.length - restDaysPerWeek)

  const daysWithMinutes = weekDates
    .filter((date) => !explicitRestDates.has(date))
    .map((date) => ({ date, minutes: getAvailableMinutes(availability, date) }))
    .filter((d) => d.minutes >= MIN_VIABLE_SESSION_MINUTES)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, maxTrainingDays)

  const numDays = daysWithMinutes.length
  const roles = WEEKLY_SLOT_ROLES[Math.min(numDays, 7)] ?? []

  const sessions: PlannedSession[] = []

  for (let slot = 0; slot < roles.length; slot++) {
    const role = roles[slot]!
    const day = daysWithMinutes[slot]
    if (!day) continue

    const discipline = disciplineForRole(role)
    const priority = priorityForRole(role)

    const preferredType =
      role === 'long'
        ? 'long'
        : role === 'quality'
          ? QUALITY_TYPE_BY_PHASE[phase]
          : role === 'quality2'
            ? getQuality2Type(phase, weekIndexInPhase, tier)
            : role === 'easy'
              ? 'endurance'
              : undefined

    const template = pickBestFittingTemplate(discipline, preferredType, day.minutes, {
      tier,
      rotationKey: weekIndexInPhase,
    })
    if (!template) continue

    // A slot only earns "key" if it actually delivers the anchor stimulus —
    // if time constraints degraded it all the way to a recovery-tier
    // session, calling it "key" would contradict the explanation shown to
    // the athlete.
    const effectivePriority =
      priority === 'key' && template.sessionType === 'recovery' ? 'secondary' : priority

    sessions.push(
      instantiateSessionTemplate(template, { date: day.date, weekId, priority: effectivePriority }),
    )
  }

  return sessions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
