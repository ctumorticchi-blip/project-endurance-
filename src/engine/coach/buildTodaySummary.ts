import { daysUntilRace, type RaceGoal } from '@/core/goals/RaceGoal'
import type { PlannedSession } from '@/core/training/PlannedSession'
import {
  findSessionForDate,
  findWeekForDate,
  type TrainingPhaseName,
  type TrainingPlan,
} from '@/core/training/TrainingPlan'
import type { DateISO } from '@/shared/types/common'
import { addDays } from '@/shared/utils/date'
import { TRIATHLON_DISTANCES } from '@/sports/triathlon/domain/distance'

export interface TodaySummary {
  daysUntilRace: number
  raceLabel: string
  phase: TrainingPhaseName | undefined
  session: PlannedSession | undefined
  /** The "pourquoi aujourd'hui" narrative — always present, even on a rest day. */
  explanation: string
  /** A short look-ahead used by the explanation and, later, the Plan screen. */
  nextSession: PlannedSession | undefined
}

const PHASE_RATIONALE: Record<TrainingPhaseName, string> = {
  base: 'On construit ta base aérobie avant d\'augmenter l\'intensité.',
  build: 'On développe progressivement ta capacité à soutenir un effort plus élevé.',
  specific: 'On se rapproche des allures et sensations de ta course.',
  taper: 'On réduit le volume pour arriver frais et affûté le jour J.',
  race: 'C\'est la semaine de course : l\'objectif est d\'arriver frais, pas de progresser davantage.',
}

function describeSession(session: PlannedSession): string {
  return session.objective
}

export function buildTodaySummary(input: {
  plan: TrainingPlan
  raceGoal: RaceGoal
  today: DateISO
}): TodaySummary {
  const { plan, raceGoal, today } = input
  const week = findWeekForDate(plan, today)
  const session = findSessionForDate(plan, today)
  const tomorrow = addDays(today, 1)
  const nextSession = findSessionForDate(plan, tomorrow)

  const remainingDays = daysUntilRace(raceGoal.raceDate, new Date(today))
  const distanceLabel = TRIATHLON_DISTANCES[raceGoal.distance].label

  let explanation: string
  if (!session) {
    explanation = week
      ? `Repos aujourd'hui. ${PHASE_RATIONALE[week.phase]}`
      : "Ton programme ne couvre pas encore cette date."
  } else {
    const priorityNote =
      session.priority === 'key'
        ? "C'est une séance clé de ta semaine."
        : session.priority === 'optional'
          ? 'Séance complémentaire : à faire si ton temps et ton énergie le permettent.'
          : ''
    const phaseNote = week ? PHASE_RATIONALE[week.phase] : ''
    const lookAhead = nextSession
      ? `Demain : ${nextSession.title.toLowerCase()} (${nextSession.discipline}).`
      : ''
    explanation = [priorityNote, phaseNote, describeSession(session), lookAhead]
      .filter(Boolean)
      .join(' ')
  }

  return {
    daysUntilRace: remainingDays,
    raceLabel: distanceLabel,
    phase: week?.phase,
    session,
    explanation,
    nextSession,
  }
}
