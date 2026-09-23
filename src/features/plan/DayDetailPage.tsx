import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import type { PlannedSession } from '@/core/training/PlannedSession'
import { findSessionForDate, findWeekForDate } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { addSessionToPlan, removeSessionFromPlan, replaceSessionInPlan } from '@/engine/adaptation/applyAdaptationToPlan'
import { calculateAthleteZones } from '@/engine/calibration/calculateAthleteZones'
import { explainSession } from '@/engine/coach/explainSession'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { CoachInsight } from '@/shared/components/CoachInsight'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { RestDayMovePrompt } from '@/shared/components/RestDayMovePrompt'
import { SessionBlockList } from '@/shared/components/SessionBlockList'
import { SwapSessionControl } from '@/shared/components/SwapSessionControl'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import { SESSION_PRIORITY_LABELS, SESSION_PRIORITY_TONE } from '@/shared/sessionPriorityLabels'
import { toISODate } from '@/shared/utils/date'

function formatFullDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Preview any day of the plan in advance — reached by clicking a day in
 * the Plan view (brief feedback) — and, for today or a future day, change
 * its discipline right from here (the same swap Today offers). */
export function DayDetailPage() {
  const { date } = useParams<{ date: string }>()
  const [, forceRefresh] = useState(0)
  const [pendingRest, setPendingRest] = useState<PlannedSession | null>(null)
  const plan = TrainingPlanRepository.load()
  const availability = AvailabilityRepository.load()
  const raceGoal = RaceGoalRepository.load()

  if (!plan || !date || !raceGoal) {
    return (
      <PlaceholderPage
        title="Jour introuvable"
        description="Impossible de retrouver cette date dans ton programme."
      />
    )
  }

  const week = findWeekForDate(plan, date)
  if (!week) {
    return (
      <PlaceholderPage
        title="Jour introuvable"
        description="Cette date n'est pas couverte par ton programme."
      />
    )
  }

  const session = findSessionForDate(plan, date)
  const today = toISODate(new Date())
  const isPast = date < today
  const athleteProfile = AthleteProfileRepository.load()
  const zones = calculateAthleteZones(athleteProfile?.knownMetrics ?? {})
  const sessionExplanation = session ? explainSession(session) : undefined

  const handleSwap = (newSession: PlannedSession) => {
    TrainingPlanRepository.save(replaceSessionInPlan(plan, newSession))
    forceRefresh((v) => v + 1)
  }

  const handleConvertToRest = () => {
    if (!session) return
    TrainingPlanRepository.save(removeSessionFromPlan(plan, session.id))
    setPendingRest(session)
    forceRefresh((v) => v + 1)
  }

  const handleMoveResolved = (moved: PlannedSession | undefined) => {
    if (moved && pendingRest) {
      const latestPlan = TrainingPlanRepository.load()
      if (latestPlan) {
        TrainingPlanRepository.save(addSessionToPlan(latestPlan, pendingRest.weekId, moved))
      }
    }
    setPendingRest(null)
    forceRefresh((v) => v + 1)
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <Link to="/plan" className="text-xs text-text-muted underline">
        Retour au programme
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold capitalize">{formatFullDate(date)}</h1>
        {date === today && <Badge tone="primary">Aujourd'hui</Badge>}
      </div>

      {pendingRest && availability ? (
        <RestDayMovePrompt
          cancelledSession={pendingRest}
          week={week}
          phase={week.phase}
          availability={availability}
          planEndDateExclusive={raceGoal.raceDate}
          onResolved={handleMoveResolved}
        />
      ) : session ? (
        <>
          <Card variant="raised">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-text-muted">{DISCIPLINE_LABELS[session.discipline]}</p>
              <Badge tone={SESSION_PRIORITY_TONE[session.priority]}>{SESSION_PRIORITY_LABELS[session.priority]}</Badge>
            </div>
            <h2 className="text-lg font-semibold">{session.title}</h2>
            <p className="mt-1 text-sm text-text-muted">{session.estimatedDurationMin} min</p>
          </Card>

          <CoachInsight explanation={sessionExplanation} fallbackMessage={session.objective} />

          <section>
            <h2 className="mb-2 text-sm font-semibold">Structure</h2>
            <SessionBlockList session={session} zones={zones} />
          </section>

          {!isPast && availability && (
            <SwapSessionControl
              session={session}
              week={week}
              phase={week.phase}
              availability={availability}
              onSwapped={handleSwap}
              onConvertedToRest={handleConvertToRest}
              allowDisciplineSwap={raceGoal.sport === 'triathlon'}
            />
          )}
        </>
      ) : (
        <Card variant="muted" className="text-sm text-text-muted">
          Jour de repos.
        </Card>
      )}
    </div>
  )
}
