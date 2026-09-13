import type { Availability } from '@/core/availability/Availability'
import { daysUntilRace, type RaceGoal } from '@/core/goals/RaceGoal'
import { createTrainingPlan, type TrainingPhaseName, type TrainingPlan, type TrainingWeek } from '@/core/training/TrainingPlan'
import { estimateWeekLoad } from '@/engine/metrics/load'
import { addDays, toISODate } from '@/shared/utils/date'
import { TRIATHLON_DISTANCES } from '../domain/distance'
import { buildWeekSessions } from './buildWeekSessions'
import { allocatePhases } from './phaseAllocation'

export interface GenerateTrainingPlanInput {
  raceGoal: RaceGoal
  availability: Availability
  today?: Date
}

export interface GenerateTrainingPlanResult {
  plan: TrainingPlan
  /** Non-fatal notices for the UI — e.g. an aggressively short runway (brief §16). */
  warnings: string[]
}

export function generateTrainingPlan(
  input: GenerateTrainingPlanInput,
): GenerateTrainingPlanResult {
  const today = input.today ?? new Date()
  const startDate = toISODate(today)
  const totalDays = daysUntilRace(input.raceGoal.raceDate, today) + 1
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7))

  const phases = allocatePhases(totalWeeks, input.raceGoal.distance)

  const warnings: string[] = []
  const spec = TRIATHLON_DISTANCES[input.raceGoal.distance]
  if (totalWeeks < spec.recommendedMinWeeksBeginner) {
    warnings.push(
      `Seulement ${totalWeeks} semaine(s) avant la course : c'est court pour un ${spec.label}. ` +
        `Le programme reste prudent (progression limitée) plutôt que d'être agressif.`,
    )
  }

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
