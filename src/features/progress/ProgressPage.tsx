import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { AdaptationDecisionRepository } from '@/engine/adaptation/AdaptationDecisionRepository'
import { buildProgressSummary } from '@/engine/history/buildProgressSummary'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { StatTile } from '@/shared/components/StatTile'

const DISCIPLINE_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Renforcement',
  mobility: 'Mobilité',
  brick: 'Brick',
}

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

  const disciplineEntries = Object.entries(summary.disciplineMinutes)

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton progrès</h1>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="Séances enregistrées"
          value={String(summary.totalCompletedSessions)}
        />
        <StatTile label="Temps total" value={`${Math.round(summary.totalMinutes / 60)} h`} />
        {summary.consistencyRate !== undefined && (
          <StatTile
            label="Régularité"
            value={`${Math.round(summary.consistencyRate * 100)}%`}
            hint="séances réalisées récemment"
          />
        )}
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Ce que j'ai appris</h2>
        <Card variant="muted" className="text-sm text-text-muted">
          {summary.learnedInsight}
        </Card>
      </section>

      {disciplineEntries.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Volume par discipline</h2>
          <ul className="flex flex-col gap-1">
            {disciplineEntries.map(([discipline, minutes]) => (
              <li key={discipline} className="flex justify-between text-sm">
                <span>{DISCIPLINE_LABELS[discipline] ?? discipline}</span>
                <span className="text-text-muted">{Math.round(minutes / 60)} h</span>
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
              <Card
                key={`${decision.sessionId}-${decision.type}-${i}`}
                as="li"
                variant="muted"
                className="text-xs text-text-muted"
              >
                {decision.explanation}
              </Card>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
