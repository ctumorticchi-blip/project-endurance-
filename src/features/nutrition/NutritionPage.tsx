import {
  getFuelingGuidance,
  getNutritionDisclaimer,
  NUTRITION_PRINCIPLES,
  RACE_DAY_GUIDANCE,
} from '@/config/nutritionGuidance'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { buildTodaySummary } from '@/engine/coach/buildTodaySummary'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { toISODate } from '@/shared/utils/date'

export function NutritionPage() {
  const plan = TrainingPlanRepository.load()
  const raceGoal = RaceGoalRepository.load()
  const profile = AthleteProfileRepository.load()

  if (!plan || !raceGoal) {
    return <PlaceholderPage title="Nutrition" description="Ton programme n'a pas encore été généré." />
  }

  const weightKg = profile?.biometrics.weightKg
  const today = toISODate(new Date())
  const summary = buildTodaySummary({ plan, raceGoal, today })
  const fueling = getFuelingGuidance(summary.session, weightKg)
  const raceDay = RACE_DAY_GUIDANCE[raceGoal.distance]

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Nutrition</h1>
        <p className="text-sm text-text-muted">
          Des repères pour t'alimenter autour de tes séances et le jour de la course.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Aujourd'hui — {fueling.title}</h2>
        <Card variant="raised" className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Avant</p>
            <p className="text-text-muted">{fueling.before}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Pendant</p>
            <p className="text-text-muted">{fueling.during}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Après</p>
            <p className="text-text-muted">{fueling.after}</p>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Principes généraux</h2>
        <ul className="flex flex-col gap-2">
          {NUTRITION_PRINCIPLES.map((principle) => (
            <Card key={principle.title} as="li" variant="muted" className="text-sm">
              <p className="font-medium">{principle.title}</p>
              <p className="mt-1 text-xs text-text-muted">{principle.body}</p>
            </Card>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Stratégie jour de course — {raceDay.label}</h2>
        <Card variant="muted" className="text-sm text-text-muted">
          {raceDay.strategy}
        </Card>
      </section>

      <p className="text-xs text-text-faint">{getNutritionDisclaimer(Boolean(weightKg))}</p>
    </div>
  )
}
