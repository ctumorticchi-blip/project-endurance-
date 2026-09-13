import { Link } from 'react-router-dom'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { buildTodaySummary } from '@/engine/coach/buildTodaySummary'
import { LinkButton } from '@/shared/components/LinkButton'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { toISODate } from '@/shared/utils/date'
import { ReadinessCheckIn } from './ReadinessCheckIn'

const DISCIPLINE_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Renforcement',
  mobility: 'Mobilité',
  brick: 'Brick',
}

function formatBlock(block: { label: string; durationSec?: number; distanceMeters?: number; repeat?: number; restSec?: number; note?: string }) {
  const parts: string[] = []
  if (block.repeat && block.repeat > 1) parts.push(`${block.repeat} x`)
  if (block.durationSec) parts.push(`${Math.round(block.durationSec / 60)} min`)
  if (block.distanceMeters) parts.push(`${block.distanceMeters} m`)
  if (block.restSec) parts.push(`récup ${block.restSec}s`)
  return parts.join(' ')
}

export function TodayPage() {
  const plan = TrainingPlanRepository.load()
  const raceGoal = RaceGoalRepository.load()

  if (!plan || !raceGoal) {
    return <PlaceholderPage title="Aujourd’hui" description="Ton programme n'a pas encore été généré." />
  }

  const today = toISODate(new Date())
  const summary = buildTodaySummary({ plan, raceGoal, today })

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-text-muted">
          TRIATHLON {summary.raceLabel} · J-{summary.daysUntilRace}
        </p>
        <h1 className="text-lg font-semibold">Aujourd'hui</h1>
      </div>

      {summary.session ? (
        <>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium text-text-muted">
              {DISCIPLINE_LABELS[summary.session.discipline]}
            </p>
            <h2 className="text-base font-semibold">{summary.session.title}</h2>
            <p className="mt-1 text-sm text-text-muted">
              {summary.session.estimatedDurationMin} min · Charge prévue{' '}
              {Math.round(summary.session.estimatedDurationMin)} · Priorité{' '}
              {summary.session.priority === 'key'
                ? 'clé'
                : summary.session.priority === 'secondary'
                  ? 'secondaire'
                  : 'optionnelle'}
            </p>
          </div>

          <section>
            <h3 className="mb-1 text-sm font-semibold">Objectif</h3>
            <p className="text-sm text-text-muted">{summary.session.objective}</p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Structure</h3>
            <ol className="flex flex-col gap-2">
              {summary.session.blocks.map((block) => (
                <li key={block.id} className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
                  <p className="font-medium">{block.label}</p>
                  <p className="text-xs text-text-muted">
                    {formatBlock(block)}
                    {block.targetZone ? ` · ${block.targetZone}` : ''} · RPE {block.targetRpeMin}-
                    {block.targetRpeMax}
                  </p>
                  {block.note && <p className="mt-1 text-xs text-text-muted">{block.note}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold">Pourquoi cette séance ?</h3>
            <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-muted">
              {summary.explanation}
            </p>
          </section>

          <ReadinessCheckIn date={today} plannedSessionId={summary.session.id} />

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
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-base font-semibold">Jour de repos</h2>
          <p className="mt-2 text-sm text-text-muted">{summary.explanation}</p>
        </div>
      )}
    </div>
  )
}
