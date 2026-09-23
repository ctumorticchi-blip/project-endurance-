import type { AthleteProfile } from '@/core/athlete/AthleteProfile'
import type { Availability } from '@/core/availability/Availability'
import { daysUntilRace, type TriathlonRaceGoal } from '@/core/goals/RaceGoal'
import { createTrainingPlan, type TrainingPhaseName, type TrainingPlan, type TrainingWeek } from '@/core/training/TrainingPlan'
import { estimateWeekLoad } from '@/engine/metrics/load'
import { addDays, toISODate } from '@/shared/utils/date'
import { TRIATHLON_DISTANCES } from '../domain/distance'
import { buildWeekSessions } from './buildWeekSessions'
import { allocatePhases } from './phaseAllocation'

export interface GenerateTrainingPlanInput {
  raceGoal: TriathlonRaceGoal
  availability: Availability
  /**
   * Required so the Weekly Stimulus Composer can bias each week's
   * secondary-touch rotation toward the athlete's own limiter discipline
   * instead of every triathlete getting an identical rotation (Training
   * Intelligence V2 — see `sports/triathlon/coaching/limiterAnalysis.ts`).
   */
  athleteProfile: AthleteProfile
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

  // How many weeks each phase spans in total — phases are always
  // contiguous blocks (see phaseAllocation.ts), so a simple count of each
  // name's occurrences gives the current phase's full length, which the
  // load curve needs to place a week correctly within its block (e.g. a
  // 2-week taper's first week isn't as light as its last).
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
      athleteProfile: input.athleteProfile,
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
