import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { SecondaryRaceGoal } from '@/core/goals/SecondaryRaceGoal'
import { TRAINING_PHASE_LABELS, type TrainingWeek } from '@/core/training/TrainingPlan'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import { addDays, toISODate } from '@/shared/utils/date'

const PRIORITY_LABELS: Record<string, string> = {
  key: 'Clé',
  secondary: 'Secondaire',
  optional: 'Optionnelle',
}
const PRIORITY_TONE = { key: 'primary', secondary: 'neutral', optional: 'neutral' } as const

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Every calendar day of the week, each paired with its session when one
 * exists — a day with none is a real rest day, shown as such rather than
 * silently omitted (brief feedback: rest days should be visible). Also
 * paired with a secondary (B/C) race landing on that day, if any — purely
 * informational, never changes what the day itself shows. */
function weekDays(week: TrainingWeek, secondaryRaces: SecondaryRaceGoal[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(week.startDate, i)
    return {
      date,
      session: week.sessions.find((s) => s.date === date),
      race: secondaryRaces.find((r) => r.raceDate === date),
    }
  })
}

interface WeekCardProps {
  week: TrainingWeek
  /** The week containing today — expanded by default, visually marked;
   * every other week starts collapsed to a one-line summary so a full
   * multi-month plan doesn't dump every session on screen at once. */
  isCurrent: boolean
  secondaryRaces?: SecondaryRaceGoal[]
}

export function WeekCard({ week, isCurrent, secondaryRaces = [] }: WeekCardProps) {
  const [expanded, setExpanded] = useState(isCurrent)
  const totalMinutes = week.sessions.reduce((sum, s) => sum + s.estimatedDurationMin, 0)
  const summaryId = `${week.id}-sessions`
  const today = toISODate(new Date())

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

      {expanded && (
        <ul id={summaryId} className="mt-2 flex flex-col gap-1">
          {weekDays(week, secondaryRaces).map(({ date, session, race }) => (
            <li key={date}>
              <Link
                to={`/day/${date}`}
                className={`flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-1.5 py-1.5 text-xs transition-colors hover:bg-surface-muted ${
                  date === today ? 'bg-surface-muted' : ''
                }`}
              >
                {session ? (
                  <>
                    <span>
                      {formatDate(date)} · {DISCIPLINE_LABELS[session.discipline]} — {session.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-text-muted">
                      {race && <Badge tone="accent">🏁 {race.raceName}</Badge>}
                      <Badge tone={PRIORITY_TONE[session.priority]}>{PRIORITY_LABELS[session.priority]}</Badge>
                      {session.estimatedDurationMin} min
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-text-muted">{formatDate(date)}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {race && <Badge tone="accent">🏁 {race.raceName}</Badge>}
                      <Badge tone="neutral">Repos</Badge>
                    </span>
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
