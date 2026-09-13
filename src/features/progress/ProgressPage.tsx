import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { AdaptationDecisionRepository } from '@/engine/adaptation/AdaptationDecisionRepository'
import { buildProgressSummary } from '@/engine/history/buildProgressSummary'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

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
        <p className="text-sm text-text-muted">
          {summary.totalCompletedSessions} séance{summary.totalCompletedSessions === 1 ? '' : 's'}{' '}
          enregistrée{summary.totalCompletedSessions === 1 ? '' : 's'} · {Math.round(summary.totalMinutes / 60)} h
          au total
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Ce que j'ai appris</h2>
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-muted">
          {summary.learnedInsight}
        </p>
      </section>

      {summary.consistencyRate !== undefined && (
        <section>
          <h2 className="mb-1 text-sm font-semibold">Régularité</h2>
          <p className="text-sm text-text-muted">
            {Math.round(summary.consistencyRate * 100)}% des séances prévues ont été réalisées
            (complètes ou partielles) récemment.
          </p>
        </section>
      )}

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
              <li
                key={`${decision.sessionId}-${decision.type}-${i}`}
                className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-text-muted"
              >
                {decision.explanation}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
