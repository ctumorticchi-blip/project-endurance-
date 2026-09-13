import type { Availability } from '@/core/availability/Availability'
import type { CompletedSession } from '@/core/history/CompletedSession'
import type { SessionFeedback, SessionOutcome } from '@/core/history/SessionFeedback'
import { allSessions, type TrainingPlan } from '@/core/training/TrainingPlan'
import type { AdaptationDecision } from '@/engine/adaptation/AdaptationDecision'
import type { Discipline } from '@/shared/types/common'
import { detectAvailabilityGap, type AvailabilityGapResult } from './detectAvailabilityGap'

/** Below this many recorded outcomes, a consistency rate would be noise,
 * not a signal (brief §45: don't conclude what the data can't support). */
const MIN_FEEDBACK_FOR_CONSISTENCY = 5
const MIN_COMPLETED_FOR_INSIGHT = 5
const HIGH_CONSISTENCY_THRESHOLD = 0.85

export interface ProgressSummary {
  totalCompletedSessions: number
  totalMinutes: number
  /** Share of logged sessions that were completed or partial, or undefined with too little history. */
  consistencyRate: number | undefined
  disciplineMinutes: Partial<Record<Discipline, number>>
  availabilityGap: AvailabilityGapResult
  /** Most recent first. */
  recentAdaptations: AdaptationDecision[]
  /** The "Ce que j'ai appris" narrative — always non-empty, never a fabricated trend. */
  learnedInsight: string
}

function buildLearnedInsight(
  totalCompletedSessions: number,
  consistencyRate: number | undefined,
  availabilityGap: AvailabilityGapResult,
): string {
  if (totalCompletedSessions < MIN_COMPLETED_FOR_INSIGHT) {
    return "Continue à enregistrer tes séances : après quelques semaines, cette page t'aidera à voir ta régularité et ta progression."
  }
  if (availabilityGap.hasGap && availabilityGap.suggestion) {
    return availabilityGap.suggestion
  }
  if (consistencyRate !== undefined && consistencyRate >= HIGH_CONSISTENCY_THRESHOLD) {
    return 'Ta régularité est excellente sur tes dernières séances : continue ainsi, la constance compte plus que la perfection.'
  }
  return 'Continue comme ça : la régularité sur la durée compte plus que chaque séance individuelle.'
}

export function buildProgressSummary(input: {
  plan: TrainingPlan
  completedSessions: CompletedSession[]
  feedback: SessionFeedback[]
  availability: Availability
  adaptationDecisions: AdaptationDecision[]
}): ProgressSummary {
  const { plan, completedSessions, feedback, availability, adaptationDecisions } = input
  const sessionsById = new Map(allSessions(plan).map((s) => [s.id, s]))

  const totalMinutes = completedSessions.reduce((sum, c) => sum + (c.actualDurationMin ?? 0), 0)

  const disciplineMinutes: Partial<Record<Discipline, number>> = {}
  for (const completed of completedSessions) {
    const planned = sessionsById.get(completed.plannedSessionId)
    if (!planned) continue
    disciplineMinutes[planned.discipline] =
      (disciplineMinutes[planned.discipline] ?? 0) + (completed.actualDurationMin ?? 0)
  }

  const outcomeCounts = feedback.reduce<Partial<Record<SessionOutcome, number>>>((acc, f) => {
    acc[f.outcome] = (acc[f.outcome] ?? 0) + 1
    return acc
  }, {})

  const consistencyRate =
    feedback.length >= MIN_FEEDBACK_FOR_CONSISTENCY
      ? ((outcomeCounts.completed ?? 0) + (outcomeCounts.partial ?? 0)) / feedback.length
      : undefined

  const availabilityGap = detectAvailabilityGap(availability, feedback)
  const recentAdaptations = [...adaptationDecisions].reverse().slice(0, 5)

  return {
    totalCompletedSessions: completedSessions.length,
    totalMinutes,
    consistencyRate,
    disciplineMinutes,
    availabilityGap,
    recentAdaptations,
    learnedInsight: buildLearnedInsight(completedSessions.length, consistencyRate, availabilityGap),
  }
}
