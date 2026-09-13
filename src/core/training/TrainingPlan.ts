import type { DateISO } from '@/shared/types/common'
import type { PlannedSession } from './PlannedSession'

export type TrainingPhaseName = 'base' | 'build' | 'specific' | 'taper' | 'race'

export const TRAINING_PHASE_LABELS: Record<TrainingPhaseName, string> = {
  base: 'Base',
  build: 'Développement',
  specific: 'Spécifique',
  taper: 'Affûtage',
  race: 'Course',
}

export interface TrainingWeek {
  id: string
  /** 1-indexed from the plan's first week. */
  weekNumber: number
  /** Monday of this week. */
  startDate: DateISO
  phase: TrainingPhaseName
  /** Planned total load for the week (arbitrary unit — see engine/metrics). */
  targetLoad: number
  sessions: PlannedSession[]
}

export interface TrainingPlan {
  id: string
  raceGoalId: string
  createdAt: string
  weeks: TrainingWeek[]
}

export function createTrainingPlan(input: Omit<TrainingPlan, 'id' | 'createdAt'>): TrainingPlan {
  return { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
}

export function findWeekForDate(plan: TrainingPlan, date: DateISO): TrainingWeek | undefined {
  const target = new Date(date).getTime()
  return plan.weeks.find((week) => {
    const start = new Date(week.startDate).getTime()
    const end = start + 7 * 24 * 60 * 60 * 1000
    return target >= start && target < end
  })
}

export function findSessionForDate(
  plan: TrainingPlan,
  date: DateISO,
): PlannedSession | undefined {
  const week = findWeekForDate(plan, date)
  return week?.sessions.find((s) => s.date === date)
}

export function allSessions(plan: TrainingPlan): PlannedSession[] {
  return plan.weeks.flatMap((w) => w.sessions)
}
