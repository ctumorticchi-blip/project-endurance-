import type { Availability } from '@/core/availability/Availability'
import { daysUntilRace, type RunningRaceGoal } from '@/core/goals/RaceGoal'
import { createTrainingPlan, type TrainingPhaseName, type TrainingPlan, type TrainingWeek } from '@/core/training/TrainingPlan'
import { estimateWeekLoad } from '@/engine/metrics/load'
import { addDays, toISODate } from '@/shared/utils/date'
import { RUNNING_DISTANCES } from '../domain/distance'
import { buildWeekSessions } from './buildWeekSessions'
import { allocatePhases } from './phaseAllocation'

export interface GenerateRunningPlanInput {
  raceGoal: RunningRaceGoal
  availability: Availability
  today?: Date
}

export interface GenerateRunningPlanResult {
  plan: TrainingPlan
  /** Non-fatal notices for the UI — e.g. an aggressively short runway. */
  warnings: string[]
}

/**
 * Running's own plan generator — same race-backwards, phase-then-week
 * structure as `sports/triathlon/planning/generateTrainingPlan.ts`, built
 * on running's own phase allocation (distance-specific base/build/specific
 * ratios) and weekly-slot roles (long/quality/quality2/easy) instead of
 * triathlon's per-discipline rotation. Shares the sport-agnostic load
 * curve (`progressionCurve.ts`) directly with triathlon via
 * `buildWeekSessions.ts`.
 */
export function generateRunningPlan(input: GenerateRunningPlanInput): GenerateRunningPlanResult {
  const today = input.today ?? new Date()
  const startDate = toISODate(today)
  const totalDays = daysUntilRace(input.raceGoal.raceDate, today) + 1
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7))

  const phases = allocatePhases(totalWeeks, input.raceGoal.distance)

  const warnings: string[] = []
  const spec = RUNNING_DISTANCES[input.raceGoal.distance]
  if (totalWeeks < spec.recommendedMinWeeksBeginner) {
    warnings.push(
      `Seulement ${totalWeeks} semaine(s) avant la course : c'est court pour un ${spec.label}. ` +
        `Le programme reste prudent (progression limitée) plutôt que d'être agressif.`,
    )
  }

  const weeksInPhase = new Map<TrainingPhaseName, number>()
  for (const phase of phases) weeksInPhase.set(phase, (weeksInPhase.get(phase) ?? 0) + 1)

  const weeks: TrainingWeek[] = []
  let weekIndexInPhase = 0
  let previousPhase: TrainingPhaseName | undefined

  for (let w = 0; w < totalWeeks; w++) {
    const phase = phases[w]!
    weekIndexInPhase = phase === previousPhase ? weekIndexInPhase + 1 : 0
    previousPhase = phase

    const weekStart = addDays(startDate, w * 7)
    const weekId = crypto.randomUUID()

    const sessions = buildWeekSessions({
      weekStart,
      planEndDateExclusive: input.raceGoal.raceDate,
      phase,
      weekIndexInPhase,
      weeksInPhase: weeksInPhase.get(phase) ?? 1,
      weekId,
      availability: input.availability,
    })

    weeks.push({
      id: weekId,
      weekNumber: w + 1,
      startDate: weekStart,
      phase,
      targetLoad: estimateWeekLoad(sessions),
      sessions,
    })
  }

  const plan = createTrainingPlan({ raceGoalId: input.raceGoal.id, weeks, warnings })
  return { plan, warnings }
}
