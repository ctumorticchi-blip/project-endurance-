import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { AdaptationDecisionRepository } from '@/engine/adaptation/AdaptationDecisionRepository'
import { buildProgressSummary } from '@/engine/history/buildProgressSummary'
import { buildWeeklyVolumeTrend } from '@/engine/history/buildWeeklyVolumeTrend'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { ProgressBar } from '@/shared/components/ProgressBar'
import { StatTile } from '@/shared/components/StatTile'
import { WeeklyVolumeChart } from './WeeklyVolumeChart'

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
  const maxDisciplineMinutes = Math.max(1, ...disciplineEntries.map(([, minutes]) => minutes))
  const weeklyVolume = buildWeeklyVolumeTrend(CompletedSessionRepository.loadAll(), new Date())

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

      {summary.totalCompletedSessions > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Volume hebdomadaire</h2>
          <Card variant="muted">
            <WeeklyVolumeChart points={weeklyVolume} />
          </Card>
        </section>
      )}

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
                  <span className="text-text-muted">{Math.round(minutes / 60)} h</span>
                </div>
                <ProgressBar
                  value={(minutes / maxDisciplineMinutes) * 100}
                  label={`${DISCIPLINE_LABELS[discipline] ?? discipline} : ${Math.round(minutes / 60)} heures`}
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
