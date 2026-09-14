import type { Availability } from '@/core/availability/Availability'
import type { RaceGoal } from '@/core/goals/RaceGoal'
import { findWeekForDate, type TrainingPlan, type TrainingWeek } from '@/core/training/TrainingPlan'
import { toISODate } from '@/shared/utils/date'
import { generateTrainingPlan } from './generateTrainingPlan'

export interface RegeneratePlanResult {
  plan: TrainingPlan
  warnings: string[]
}

/**
 * Rebuilds the plan from the week containing `today` onward with new
 * availability (e.g. after changing rest days from the profile screen),
 * while leaving every earlier week exactly as it was. Past weeks are a
 * record of what actually happened, not a draft to rewrite — the same
 * principle that already keeps a single check-in or missed session from
 * retroactively altering history elsewhere in the app.
 */
export function regeneratePlanFromToday(input: {
  currentPlan: TrainingPlan
  raceGoal: RaceGoal
  availability: Availability
  today?: Date
}): RegeneratePlanResult {
  const today = input.today ?? new Date()
  const todayISO = toISODate(today)
  const currentWeek = findWeekForDate(input.currentPlan, todayISO)

  const cutoff = currentWeek?.startDate ?? todayISO
  const pastWeeks = input.currentPlan.weeks.filter((week) => week.startDate < cutoff)

  const { plan: freshPlan, warnings } = generateTrainingPlan({
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
