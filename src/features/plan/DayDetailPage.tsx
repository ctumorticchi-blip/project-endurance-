import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import type { PlannedSession } from '@/core/training/PlannedSession'
import { findSessionForDate, findWeekForDate } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { replaceSessionInPlan } from '@/engine/adaptation/applyAdaptationToPlan'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { SwapSessionControl } from '@/shared/components/SwapSessionControl'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import { toISODate } from '@/shared/utils/date'
import { formatBlock } from '@/shared/utils/workoutBlock'

const PRIORITY_LABELS: Record<string, string> = {
  key: 'Clé',
  secondary: 'Secondaire',
  optional: 'Optionnelle',
}
const PRIORITY_TONE = { key: 'primary', secondary: 'neutral', optional: 'neutral' } as const

function formatFullDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Preview any day of the plan in advance — reached by clicking a day in
 * the Plan view (brief feedback) — and, for today or a future day, change
 * its discipline right from here (the same swap Today offers). */
export function DayDetailPage() {
  const { date } = useParams<{ date: string }>()
  const [, forceRefresh] = useState(0)
  const plan = TrainingPlanRepository.load()
  const availability = AvailabilityRepository.load()

  if (!plan || !date) {
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

  const handleSwap = (newSession: PlannedSession) => {
    TrainingPlanRepository.save(replaceSessionInPlan(plan, newSession))
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

      {session ? (
        <>
          <Card variant="raised">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-text-muted">{DISCIPLINE_LABELS[session.discipline]}</p>
              <Badge tone={PRIORITY_TONE[session.priority]}>{PRIORITY_LABELS[session.priority]}</Badge>
            </div>
            <h2 className="text-lg font-semibold">{session.title}</h2>
            <p className="mt-1 text-sm text-text-muted">{session.estimatedDurationMin} min</p>
          </Card>

          <section>
            <h2 className="mb-1 text-sm font-semibold">Objectif</h2>
            <p className="text-sm text-text-muted">{session.objective}</p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Structure</h2>
            <ol className="flex flex-col gap-2">
              {session.blocks.map((block) => (
                <Card key={block.id} as="li" variant="muted" className="text-sm">
                  <p className="font-medium">{block.label}</p>
                  <p className="text-xs text-text-muted">
                    {formatBlock(block)}
                    {block.targetZone ? ` · ${block.targetZone}` : ''} · RPE {block.targetRpeMin}-
                    {block.targetRpeMax}
                  </p>
                  {block.note && <p className="mt-1 text-xs text-text-muted">{block.note}</p>}
                </Card>
              ))}
            </ol>
          </section>

          {!isPast && availability && (
            <SwapSessionControl
              session={session}
              week={week}
              phase={week.phase}
              availability={availability}
              onSwapped={handleSwap}
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
