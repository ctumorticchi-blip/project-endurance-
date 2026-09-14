import { weeksUntilRace } from '@/core/goals/RaceGoal'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { TRAINING_PHASE_LABELS } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { TRIATHLON_DISTANCES } from '@/sports/triathlon/domain/distance'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

const DISCIPLINE_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Renfo',
  mobility: 'Mobilité',
  brick: 'Brick',
}

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function PlanPage() {
  const plan = TrainingPlanRepository.load()
  const raceGoal = RaceGoalRepository.load()

  if (!plan || !raceGoal) {
    return (
      <PlaceholderPage
        title="Programme"
        description="Ton programme n'a pas encore été généré."
      />
    )
  }

  const distanceSpec = TRIATHLON_DISTANCES[raceGoal.distance]
  const weeksLeft = weeksUntilRace(raceGoal.raceDate)

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton programme</h1>
        <p className="text-sm text-text-muted">
          {distanceSpec.label} le {formatDate(raceGoal.raceDate)} · {weeksLeft} semaine
          {weeksLeft === 1 ? '' : 's'} restante{weeksLeft === 1 ? '' : 's'}
        </p>
      </div>

      {plan.warnings.length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-[var(--radius-sm)] bg-warning/10 px-3 py-2">
          {plan.warnings.map((w) => (
            <p key={w} className="text-xs text-warning">
              {w}
            </p>
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {plan.weeks.map((week) => (
          <Card key={week.id} as="li">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                Semaine {week.weekNumber} <Badge>{TRAINING_PHASE_LABELS[week.phase]}</Badge>
              </span>
              <span className="text-xs text-text-muted">Charge {week.targetLoad}</span>
            </div>
            {week.sessions.length === 0 ? (
              <p className="text-xs text-text-muted">Aucune séance planifiable cette semaine.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {week.sessions.map((session) => (
                  <li key={session.id} className="flex items-center justify-between text-xs">
                    <span>
                      {formatDate(session.date)} · {DISCIPLINE_LABELS[session.discipline]} —{' '}
                      {session.title}
                    </span>
                    <span className="text-text-muted">{session.estimatedDurationMin} min</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </ul>
    </div>
  )
}
