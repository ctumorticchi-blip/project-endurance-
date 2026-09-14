import type { Availability } from '@/core/availability/Availability'
import type { RunningRaceGoal } from '@/core/goals/RaceGoal'
import { findWeekForDate, type TrainingPlan, type TrainingWeek } from '@/core/training/TrainingPlan'
import { toISODate } from '@/shared/utils/date'
import { generateRunningPlan } from './generateRunningPlan'

export interface RegeneratePlanResult {
  plan: TrainingPlan
  warnings: string[]
}

/**
 * Running's own copy of `sports/triathlon/planning/regeneratePlan.ts` —
 * rebuilds the plan from the week containing `today` onward with new
 * availability, leaving every earlier week exactly as it was. Past weeks
 * are a record of what actually happened, not a draft to rewrite.
 */
export function regeneratePlanFromToday(input: {
  currentPlan: TrainingPlan
  raceGoal: RunningRaceGoal
  availability: Availability
  today?: Date
}): RegeneratePlanResult {
  const today = input.today ?? new Date()
  const todayISO = toISODate(today)
  const currentWeek = findWeekForDate(input.currentPlan, todayISO)

  const cutoff = currentWeek?.startDate ?? todayISO
  const pastWeeks = input.currentPlan.weeks.filter((week) => week.startDate < cutoff)

  const { plan: freshPlan, warnings } = generateRunningPlan({
    raceGoal: input.raceGoal,
    availability: input.availability,
    today,
  })

  const renumberedNewWeeks: TrainingWeek[] = freshPlan.weeks.map((week, index) => ({
    ...week,
    weekNumber: pastWeeks.length + index + 1,
  }))

  return {
    plan: { ...input.currentPlan, weeks: [...pastWeeks, ...renumberedNewWeeks], warnings },
    warnings,
  }
}
