import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { PerceivedDifficulty } from '@/core/history/SessionFeedback'
import type { ReadinessLevel } from '@/core/history/ReadinessCheck'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { SecondaryRaceGoalRepository } from '@/core/goals/SecondaryRaceGoalRepository'
import { findWeekForDate } from '@/core/training/TrainingPlan'
import type { PlannedSession } from '@/core/training/PlannedSession'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { AdaptationDecisionRepository } from '@/engine/adaptation/AdaptationDecisionRepository'
import type { AdaptationDecision } from '@/engine/adaptation/AdaptationDecision'
import {
  addSessionToPlan,
  applyDurationAdaptation,
  removeSessionFromPlan,
  replaceSessionInPlan,
} from '@/engine/adaptation/applyAdaptationToPlan'
import { decideAdaptation, decideAvailabilityConstraint } from '@/engine/adaptation/decideAdaptation'
import { calculateAthleteZones } from '@/engine/calibration/calculateAthleteZones'
import { buildTodaySummary } from '@/engine/coach/buildTodaySummary'
import { explainSession } from '@/engine/coach/explainSession'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { CoachInsight } from '@/shared/components/CoachInsight'
import { LinkButton } from '@/shared/components/LinkButton'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { RestDayMovePrompt } from '@/shared/components/RestDayMovePrompt'
import { SessionBlockList } from '@/shared/components/SessionBlockList'
import { SwapSessionControl } from '@/shared/components/SwapSessionControl'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import { SESSION_PRIORITY_LABELS, SESSION_PRIORITY_TONE } from '@/shared/sessionPriorityLabels'
import { toISODate } from '@/shared/utils/date'
import { AdjustAvailabilityToday } from './AdjustAvailabilityToday'
import { CurrentMealCard } from './CurrentMealCard'
import { NutritionSetupPrompt } from './NutritionSetupPrompt'
import { RaceCountdown } from './RaceCountdown'
import { ReadinessCheckIn } from './ReadinessCheckIn'
import { UpcomingRaces } from './UpcomingRaces'

const DIFFICULTY_LABELS: Record<PerceivedDifficulty, string> = {
  'harder-than-expected': 'Plus dur que prévu',
  'as-expected': 'Comme prévu',
  'easier-than-expected': 'Plus facile que prévu',
}

export function TodayPage() {
  const [adaptation, setAdaptation] = useState<AdaptationDecision | null>(null)
  const [pendingRest, setPendingRest] = useState<PlannedSession | null>(null)
  const [, forceRefresh] = useState(0)
  const plan = TrainingPlanRepository.load()
  const raceGoal = RaceGoalRepository.load()
  const availability = AvailabilityRepository.load()

  if (!plan || !raceGoal) {
    return <PlaceholderPage title="Aujourd’hui" description="Ton programme n'a pas encore été généré." />
  }

  const today = toISODate(new Date())
  const summary = buildTodaySummary({ plan, raceGoal, today })
  const week = findWeekForDate(plan, today)
  const athleteProfile = AthleteProfileRepository.load()
  const zones = calculateAthleteZones(athleteProfile?.knownMetrics ?? {})
  const sessionExplanation = summary.session ? explainSession(summary.session) : undefined
  const upcomingSecondaryRaces = SecondaryRaceGoalRepository.loadAll()
    .filter((r) => r.raceDate >= today)
    .sort((a, b) => (a.raceDate < b.raceDate ? -1 : a.raceDate > b.raceDate ? 1 : 0))

  // "Done today" — a completed/partial feedback already logged for
  // today's own session — takes priority over the pre-session view: once
  // it's done, the readiness check-in / swap / "Commencer" no longer make
  // sense for it.
  const feedbackForToday = summary.session
    ? SessionFeedbackRepository.loadAll().find(
        (f) => f.plannedSessionId === summary.session!.id && f.outcome !== 'missed',
      )
    : undefined
  const completedForToday = summary.session
    ? CompletedSessionRepository.loadAll().find((c) => c.plannedSessionId === summary.session!.id)
    : undefined

  const handleReadinessSelect = (level: ReadinessLevel) => {
    if (!summary.session) return
    const recentFeedback = [...SessionFeedbackRepository.loadAll()].reverse()
    const result = decideAdaptation({
      session: summary.session,
      readiness: level,
      recentFeedback,
      isRaceWeek: week?.phase === 'race',
    })
    AdaptationDecisionRepository.append(result)

    // Always apply, even for KEEP: KEEP's before/after are the plan's
    // baseline, which restores the session when an earlier check-in on the
    // same day had reduced or increased it (otherwise "tired" then
    // "normal" would leave the reduction in place instead of resetting it).
    const updatedSession = applyDurationAdaptation(summary.session, result)
    TrainingPlanRepository.save(replaceSessionInPlan(plan, updatedSession))

    setAdaptation(result)
  }

  const handleAvailabilityAdjust = (availableMinutes: number) => {
    if (!summary.session) return
    const result = decideAvailabilityConstraint(summary.session, availableMinutes)
    AdaptationDecisionRepository.append(result)

    const updatedSession = applyDurationAdaptation(summary.session, result)
    TrainingPlanRepository.save(replaceSessionInPlan(plan, updatedSession))

    setAdaptation(result)
  }

  const handleSwap = (newSession: PlannedSession) => {
    TrainingPlanRepository.save(replaceSessionInPlan(plan, newSession))
    setAdaptation(null)
    forceRefresh((v) => v + 1)
  }

  const handleConvertToRest = () => {
    if (!summary.session) return
    const cancelled = summary.session
    TrainingPlanRepository.save(removeSessionFromPlan(plan, cancelled.id))
    setAdaptation(null)
    setPendingRest(cancelled)
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

  const activeAdaptation = adaptation && adaptation.type !== 'KEEP' ? adaptation : undefined

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <h1 className="sr-only">Aujourd'hui</h1>
      <RaceCountdown raceLabel={summary.raceLabel} daysUntilRace={summary.daysUntilRace} />
      <UpcomingRaces races={upcomingSecondaryRaces} />
      <NutritionSetupPrompt />
      <CurrentMealCard date={today} session={summary.session} nextSession={summary.nextSession} />

      {pendingRest && week && availability ? (
        <RestDayMovePrompt
          cancelledSession={pendingRest}
          week={week}
          phase={week.phase}
          availability={availability}
          planEndDateExclusive={raceGoal.raceDate}
          onResolved={handleMoveResolved}
        />
      ) : summary.session && feedbackForToday ? (
        <>
          <Card variant="raised" className="glow-card flex flex-col items-center gap-1 py-8 text-center">
            <p aria-hidden="true" className="text-4xl">
              🎉
            </p>
            <h2 className="text-lg font-semibold">Bravo, séance terminée !</h2>
            <p className="text-sm text-text-muted">{summary.session.title}</p>
          </Card>

          <Card variant="muted" className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Durée réelle</span>
              <span>{completedForToday?.actualDurationMin ?? summary.session.estimatedDurationMin} min</span>
            </div>
            {feedbackForToday.rpe !== undefined && (
              <div className="flex justify-between">
                <span className="text-text-muted">RPE ressenti</span>
                <span>{feedbackForToday.rpe}/10</span>
              </div>
            )}
            {feedbackForToday.perceivedDifficulty && (
              <div className="flex justify-between">
                <span className="text-text-muted">Ressenti</span>
                <span>{DIFFICULTY_LABELS[feedbackForToday.perceivedDifficulty]}</span>
              </div>
            )}
          </Card>

          <CoachInsight explanation={sessionExplanation} fallbackMessage={summary.explanation} />
        </>
      ) : summary.session ? (
        <>
          <Card variant="raised">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-text-muted">
                {DISCIPLINE_LABELS[summary.session.discipline]}
              </p>
              <Badge tone={SESSION_PRIORITY_TONE[summary.session.priority]}>
                {SESSION_PRIORITY_LABELS[summary.session.priority]}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold">{summary.session.title}</h2>
            <p className="mt-1 text-sm text-text-muted">{summary.session.estimatedDurationMin} min</p>
          </Card>

          <ReadinessCheckIn
            date={today}
            plannedSessionId={summary.session.id}
            onSelect={handleReadinessSelect}
          />

          <CoachInsight
            explanation={sessionExplanation}
            fallbackMessage={summary.explanation}
            adaptation={activeAdaptation}
          />

          <section>
            <h2 className="mb-1 text-sm font-semibold">Objectif</h2>
            <p className="text-sm text-text-muted">{summary.session.objective}</p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Structure</h2>
            <SessionBlockList session={summary.session} zones={zones} />
          </section>

          <AdjustAvailabilityToday date={today} onAdjust={handleAvailabilityAdjust} />

          {week && availability && (
            <SwapSessionControl
              session={summary.session}
              week={week}
              phase={week.phase}
              availability={availability}
              onSwapped={handleSwap}
              onConvertedToRest={handleConvertToRest}
              allowDisciplineSwap={raceGoal.sport === 'triathlon'}
            />
          )}

          <LinkButton to={`/session/${summary.session.id}`} className="w-full">
            Commencer
          </LinkButton>

          <Link
            to={`/session/${summary.session.id}/missed`}
            className="text-center text-xs text-text-muted underline"
          >
            Je n'ai pas fait cette séance
          </Link>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">😌 Jour de repos</h2>
          <CoachInsight fallbackMessage={summary.explanation} />
        </>
      )}
    </div>
  )
}
