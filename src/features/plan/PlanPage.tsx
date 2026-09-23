import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { weeksUntilRace } from '@/core/goals/RaceGoal'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { getRaceDistanceLabel } from '@/core/goals/raceGoalDisplay'
import { SecondaryRaceGoalRepository } from '@/core/goals/SecondaryRaceGoalRepository'
import { findWeekForDate } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { analyzeLimiters } from '@/sports/triathlon/coaching/limiterAnalysis'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { toISODate } from '@/shared/utils/date'
import { WeekCard } from './WeekCard'

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function PlanPage() {
  const plan = TrainingPlanRepository.load()
  const raceGoal = RaceGoalRepository.load()
  const secondaryRaces = SecondaryRaceGoalRepository.loadAll()

  if (!plan || !raceGoal) {
    return (
      <PlaceholderPage
        title="Programme"
        description="Ton programme n'a pas encore été généré."
      />
    )
  }

  const distanceLabel = getRaceDistanceLabel(raceGoal)
  const weeksLeft = weeksUntilRace(raceGoal.raceDate)
  const currentWeek = findWeekForDate(plan, toISODate(new Date()))
  const athleteProfile = AthleteProfileRepository.load()
  const limiterAnalysis =
    raceGoal.sport === 'triathlon' && athleteProfile ? analyzeLimiters(athleteProfile) : undefined

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton programme</h1>
        <p className="text-sm text-text-muted">
          {distanceLabel} le {formatDate(raceGoal.raceDate)} · {weeksLeft} semaine
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

      <ul className="flex flex-col gap-3">
        {plan.weeks.map((week) => (
          <WeekCard
            key={week.id}
            week={week}
            isCurrent={week.id === currentWeek?.id}
            secondaryRaces={secondaryRaces}
            limiterAnalysis={limiterAnalysis}
          />
        ))}
      </ul>
    </div>
  )
}
