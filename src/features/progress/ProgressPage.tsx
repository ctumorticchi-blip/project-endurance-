import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { AdaptationDecisionRepository } from '@/engine/adaptation/AdaptationDecisionRepository'
import { buildLastWeekSummary } from '@/engine/history/buildLastWeekSummary'
import { buildLoadTrend } from '@/engine/history/buildLoadTrend'
import { buildProgressSummary } from '@/engine/history/buildProgressSummary'
import { AdaptationDecisionCard } from '@/shared/components/AdaptationDecisionCard'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { ProgressBar } from '@/shared/components/ProgressBar'
import { StatTile } from '@/shared/components/StatTile'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import type { Discipline } from '@/shared/types/common'
import { formatHoursAndMinutes } from '@/shared/utils/duration'
import { LoadTrendChart } from './LoadTrendChart'
import { WeekSummaryCard } from './WeekSummaryCard'

export function ProgressPage() {
  const plan = TrainingPlanRepository.load()
  const availability = AvailabilityRepository.load()

  if (!plan || !availability) {
    return <PlaceholderPage title="Progrès" description="Ton programme n'a pas encore été généré." />
  }

  const summary = buildProgressSummary({
    plan,
    completedSessions: CompletedSessionRepository.loadAll(),
    feedback: SessionFeedbackRepository.loadAll(),
    availability,
    adaptationDecisions: AdaptationDecisionRepository.loadAll(),
  })

  const disciplineEntries = Object.entries(summary.disciplineMinutes) as [Discipline, number][]
  const maxDisciplineMinutes = Math.max(1, ...disciplineEntries.map(([, minutes]) => minutes))
  const loadTrend = buildLoadTrend(plan, CompletedSessionRepository.loadAll(), new Date())
  const lastWeekSummary = buildLastWeekSummary(plan, CompletedSessionRepository.loadAll(), new Date())

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton progrès</h1>
      </div>

      {lastWeekSummary && <WeekSummaryCard summary={lastWeekSummary} />}

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="Séances enregistrées"
          value={String(summary.totalCompletedSessions)}
        />
        <StatTile label="Temps total" value={formatHoursAndMinutes(summary.totalMinutes)} />
        {summary.consistencyRate !== undefined && (
          <StatTile
            label="Régularité"
            value={`${Math.round(summary.consistencyRate * 100)}%`}
            hint="séances réalisées récemment"
          />
        )}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Charge hebdomadaire : prévue vs réalisée</h2>
        <Card variant="muted">
          <LoadTrendChart points={loadTrend} />
        </Card>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Ce que j'ai appris</h2>
        <Card variant="muted" className="text-sm text-text-muted">
          {summary.learnedInsight}
        </Card>
      </section>

      {disciplineEntries.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Volume par discipline</h2>
          <ul className="flex flex-col gap-2">
            {disciplineEntries.map(([discipline, minutes]) => (
              <li key={discipline} className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span>{DISCIPLINE_LABELS[discipline] ?? discipline}</span>
                  <span className="text-text-muted">{formatHoursAndMinutes(minutes)}</span>
                </div>
                <ProgressBar
                  value={(minutes / maxDisciplineMinutes) * 100}
                  label={`${DISCIPLINE_LABELS[discipline] ?? discipline} : ${formatHoursAndMinutes(minutes)}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.recentAdaptations.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Derniers ajustements du programme</h2>
          <ul className="flex flex-col gap-2">
            {summary.recentAdaptations.map((decision, i) => (
              <AdaptationDecisionCard key={`${decision.sessionId}-${decision.type}-${i}`} as="li" decision={decision} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
