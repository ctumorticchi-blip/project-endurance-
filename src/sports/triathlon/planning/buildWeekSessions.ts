import {
  getAvailableMinutes,
  hasPoolAccess,
  resolveDesiredRestDays,
  resolveRestDates,
  type Availability,
} from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName } from '@/core/training/TrainingPlan'
import type { DateISO, Discipline } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { instantiateSessionTemplate } from '../sessions'
import { pickBestFittingTemplate } from './pickTemplate'
import { getSessionTier, getWeekLoadMultiplier } from './progressionCurve'
import {
  applyBrickInsertion,
  getSecondaryType,
  PRIMARY_SESSION_TYPE_BY_PHASE,
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

  // Where this week sits on its phase's load curve — see
  // progressionCurve.ts for the periodization rationale (progressive
  // overload within a block, a deload week, a descending taper).
  const loadMultiplier = getWeekLoadMultiplier(phase, weekIndexInPhase, weeksInPhase)
  const tier = getSessionTier(loadMultiplier)

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (date) => date < planEndDateExclusive,
  )

  // Explicit rest day(s) always win — never scheduled, whatever their
  // declared availability says. Falls back to the old "pick whichever
  // day(s) have the least time" heuristic only when no explicit choice
  // exists (old data, or none of the chosen weekdays fall in this
  // particular week). Excluding explicit rest dates from the pool *before*
  // computing the count ceiling is what prevents an already-unavailable
  // day from being double-counted against a separately-desired rest day.
  const explicitRestDates = resolveRestDates(availability, weekDates)
  const restDaysPerWeek =
    explicitRestDates.size > 0 ? explicitRestDates.size : resolveDesiredRestDays(availability)
  const maxTrainingDays = Math.max(0, weekDates.length - restDaysPerWeek)

  const daysWithMinutes = weekDates
    .filter((date) => !explicitRestDates.has(date))
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
  // Days not yet claimed by a slot. A shared, mutable pool rather than a
  // fixed slot-index -> day mapping: when the swim slot has to skip ahead
  // to grab a pool day out of order, that day is properly removed here, so
  // no later slot can collide with it — and the day it would otherwise have
  // taken stays in the pool for a later slot instead of being silently
  // dropped (which used to leave one day of the week with no session at
  // all, looking like an extra, unrequested rest day).
  const remainingDays = [...daysWithMinutes]
  const sessions: PlannedSession[] = []

  for (let slot = 0; slot < disciplines.length; slot++) {
    const discipline = disciplines[slot]!
    const priority = WEEKLY_SLOT_PRIORITIES[slot] ?? 'optional'

    let day: (typeof daysWithMinutes)[number] | undefined
    let effectiveDiscipline: Discipline = discipline
    let effectiveOccurrence = occurrenceByDiscipline.get(discipline) ?? 0

    if (discipline === 'swim') {
      const poolIndex = remainingDays.findIndex((d) => d.pool)
      if (poolIndex !== -1) {
        day = remainingDays.splice(poolIndex, 1)[0]
      } else if (remainingDays.length > 0) {
        // No pool access anywhere this week: don't waste this day's time —
        // give it to whichever of bike/run has had the fewer sessions so far.
        day = remainingDays.shift()
        const bikeCount = occurrenceByDiscipline.get('bike') ?? 0
        const runCount = occurrenceByDiscipline.get('run') ?? 0
        effectiveDiscipline = runCount <= bikeCount ? 'run' : 'bike'
        effectiveOccurrence = runCount <= bikeCount ? runCount : bikeCount
      }
    } else {
      day = remainingDays.shift()
    }

    if (!day) continue
    occurrenceByDiscipline.set(effectiveDiscipline, effectiveOccurrence + 1)

    const preferredType =
      effectiveDiscipline === 'bike' || effectiveDiscipline === 'run' || effectiveDiscipline === 'swim'
        ? effectiveOccurrence === 0
          ? PRIMARY_SESSION_TYPE_BY_PHASE[phase][effectiveDiscipline]
          : getSecondaryType(phase, effectiveDiscipline, weekIndexInPhase, tier)
        : effectiveDiscipline === 'brick'
          ? 'brick'
          : undefined

    const template = pickBestFittingTemplate(effectiveDiscipline, preferredType, day.minutes, {
      tier,
      rotationKey: weekIndexInPhase,
    })
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
