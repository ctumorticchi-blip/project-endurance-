import { useState } from 'react'
import { TRAINING_PHASE_LABELS, type TrainingWeek } from '@/core/training/TrainingPlan'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'

const DISCIPLINE_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Renfo',
  mobility: 'Mobilité',
  brick: 'Brick',
}
const PRIORITY_LABELS: Record<string, string> = {
  key: 'Clé',
  secondary: 'Secondaire',
  optional: 'Optionnelle',
}
const PRIORITY_TONE = { key: 'primary', secondary: 'neutral', optional: 'neutral' } as const

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

interface WeekCardProps {
  week: TrainingWeek
  /** The week containing today — expanded by default, visually marked;
   * every other week starts collapsed to a one-line summary so a full
   * multi-month plan doesn't dump every session on screen at once. */
  isCurrent: boolean
}

export function WeekCard({ week, isCurrent }: WeekCardProps) {
  const [expanded, setExpanded] = useState(isCurrent)
  const totalMinutes = week.sessions.reduce((sum, s) => sum + s.estimatedDurationMin, 0)
  const summaryId = `${week.id}-sessions`

  return (
    <Card as="li" variant={isCurrent ? 'raised' : 'default'}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={summaryId}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          Semaine {week.weekNumber}
          <Badge>{TRAINING_PHASE_LABELS[week.phase]}</Badge>
          {isCurrent && <Badge tone="primary">Cette semaine</Badge>}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-text-muted">
          {week.sessions.length === 0
            ? 'Repos'
            : `${week.sessions.length} séance${week.sessions.length === 1 ? '' : 's'} · ${totalMinutes} min`}
          <span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </span>
      </button>

      {expanded &&
        (week.sessions.length === 0 ? (
          <p id={summaryId} className="mt-2 text-xs text-text-muted">
            Aucune séance planifiable cette semaine.
          </p>
        ) : (
          <ul id={summaryId} className="mt-2 flex flex-col gap-1.5">
            {week.sessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between gap-2 text-xs">
                <span>
                  {formatDate(session.date)} · {DISCIPLINE_LABELS[session.discipline]} — {session.title}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-text-muted">
                  <Badge tone={PRIORITY_TONE[session.priority]}>{PRIORITY_LABELS[session.priority]}</Badge>
                  {session.estimatedDurationMin} min
                </span>
              </li>
            ))}
          </ul>
        ))}
    </Card>
  )
}
