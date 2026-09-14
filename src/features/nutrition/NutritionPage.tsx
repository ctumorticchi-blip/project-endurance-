import { useState } from 'react'
import {
  getFuelingGuidance,
  getNutritionDisclaimer,
  NUTRITION_PRINCIPLES,
  RACE_DAY_GUIDANCE,
} from '@/config/nutritionGuidance'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { MealOverrideRepository } from '@/core/nutrition/MealOverrideRepository'
import { NutritionPreferencesRepository } from '@/core/nutrition/NutritionPreferencesRepository'
import { findWeekForDate } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { buildTodaySummary } from '@/engine/coach/buildTodaySummary'
import { applyMealOverrides } from '@/engine/nutrition/applyMealOverrides'
import { buildDailyMenu } from '@/engine/nutrition/buildDailyMenu'
import type { MealSlot } from '@/config/nutrition/mealCatalog'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import type { DateISO } from '@/shared/types/common'
import { toISODate } from '@/shared/utils/date'
import { DailyMenuSection } from './DailyMenuSection'
import { NutritionPreferencesForm } from './NutritionPreferencesForm'
import { WeeklyMenuSection } from './WeeklyMenuSection'

type MenuView = 'day' | 'week'

function ViewToggle({ view, onChange }: { view: MenuView; onChange: (view: MenuView) => void }) {
  const OPTIONS: { value: MenuView; label: string }[] = [
    { value: 'day', label: 'Jour' },
    { value: 'week', label: 'Semaine' },
  ]
  return (
    <div role="group" aria-label="Vue du menu" className="inline-flex gap-1 rounded-[var(--radius-sm)] border border-border p-0.5">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={view === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium ${
            view === option.value ? 'bg-primary text-background' : 'text-text-muted'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function NutritionPage() {
  const plan = TrainingPlanRepository.load()
  const raceGoal = RaceGoalRepository.load()
  const profile = AthleteProfileRepository.load()
  const [preferences, setPreferences] = useState(() => NutritionPreferencesRepository.load())
  const [editingPreferences, setEditingPreferences] = useState(false)
  const [view, setView] = useState<MenuView>('day')
  const [overrides, setOverrides] = useState(() => MealOverrideRepository.loadAll())

  if (!plan || !raceGoal) {
    return <PlaceholderPage title="Nutrition" description="Ton programme n'a pas encore été généré." />
  }

  const weightKg = profile?.biometrics?.weightKg
  const today = toISODate(new Date())
  const summary = buildTodaySummary({ plan, raceGoal, today })
  const fueling = getFuelingGuidance(summary.session, weightKg)
  const raceDay = RACE_DAY_GUIDANCE[raceGoal.distance]
  const currentWeek = findWeekForDate(plan, today)

  const dailyMenu =
    preferences &&
    applyMealOverrides(
      buildDailyMenu({ date: today, session: summary.session, nextSession: summary.nextSession, preferences }),
      overrides,
    )

  const handleOverride = (date: DateISO, slot: MealSlot, mealId: string) => {
    MealOverrideRepository.set(date, slot, mealId)
    setOverrides(MealOverrideRepository.loadAll())
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Nutrition</h1>
        <p className="text-sm text-text-muted">
          Des repères pour t'alimenter autour de tes séances et le jour de la course.
        </p>
      </div>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {view === 'day' ? 'Ton menu du jour' : 'Ton menu de la semaine'}
          </h2>
          <div className="flex items-center gap-3">
            {preferences && <ViewToggle view={view} onChange={setView} />}
            {preferences && !editingPreferences && (
              <button
                type="button"
                onClick={() => setEditingPreferences(true)}
                className="text-xs font-medium text-accent underline"
              >
                Modifier mes préférences
              </button>
            )}
          </div>
        </div>

        {!preferences || editingPreferences ? (
          <NutritionPreferencesForm
            initial={preferences}
            onCancel={preferences ? () => setEditingPreferences(false) : undefined}
            onSaved={(saved) => {
              NutritionPreferencesRepository.save(saved)
              setPreferences(saved)
              setEditingPreferences(false)
            }}
          />
        ) : view === 'day' ? (
          dailyMenu && (
            <DailyMenuSection date={today} entries={dailyMenu.entries} preferences={preferences} onOverride={handleOverride} />
          )
        ) : currentWeek ? (
          <WeeklyMenuSection
            plan={plan}
            weekStart={currentWeek.startDate}
            today={today}
            preferences={preferences}
            overrides={overrides}
            onOverride={handleOverride}
          />
        ) : (
          <p className="text-xs text-text-muted">Ton programme ne couvre pas encore cette semaine.</p>
        )}
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
        <h2 className="mb-2 text-sm font-semibold">Stratégie jour de course — {raceDay.label}</h2>
        <Card variant="muted" className="text-sm text-text-muted">
          {raceDay.strategy}
        </Card>
      </section>

      <p className="text-xs text-text-faint">{getNutritionDisclaimer(Boolean(weightKg))}</p>
    </div>
  )
}
