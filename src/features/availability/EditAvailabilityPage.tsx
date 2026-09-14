import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import type { Availability, DayAvailability } from '@/core/availability/Availability'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { regeneratePlanFromToday } from '@/sports/triathlon/planning/regeneratePlan'
import { Button } from '@/shared/components/Button'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import type { Weekday } from '@/shared/types/common'
import { AvailabilityForm } from './AvailabilityForm'

export function EditAvailabilityPage() {
  const navigate = useNavigate()
  const availability = AvailabilityRepository.load()
  const raceGoal = RaceGoalRepository.load()
  const currentPlan = TrainingPlanRepository.load()

  const [draft, setDraft] = useState<Availability | undefined>(availability)
  const [saved, setSaved] = useState(false)

  if (!availability || !raceGoal || !currentPlan || !draft) {
    return (
      <PlaceholderPage
        title="Disponibilités"
        description="Ton programme n'a pas encore été généré."
      />
    )
  }

  if (raceGoal.sport !== 'triathlon') {
    // TODO(RUN-5): branch regeneratePlanFromToday by sport once a running
    // plan generator exists (RUN-3) — for now this screen stays triathlon-only.
    return (
      <PlaceholderPage
        title="Disponibilités"
        description="La modification des disponibilités arrive bientôt pour les programmes course à pied."
      />
    )
  }

  const setDay = (day: Weekday, patch: Partial<DayAvailability>) => {
    setDraft({ ...draft, weeklyPattern: { ...draft.weeklyPattern, [day]: { ...draft.weeklyPattern[day], ...patch } } })
  }

  const canSave = (draft.restDays?.length ?? 0) > 0

  const handleSave = () => {
    if (!canSave) return
    AvailabilityRepository.save(draft)
    const { plan } = regeneratePlanFromToday({ currentPlan, raceGoal, availability: draft })
    TrainingPlanRepository.save(plan)
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <h1 className="text-lg font-semibold">Disponibilités mises à jour</h1>
        <p className="text-sm text-text-muted">
          Ton programme a été réajusté à partir d'aujourd'hui — les semaines déjà passées ne
          changent pas.
        </p>
        <Button onClick={() => void navigate('/profile', { replace: true })} className="w-full">
          Retour au profil
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Modifier tes disponibilités</h1>
        <p className="text-sm text-text-muted">
          Ton programme sera réajusté à partir d'aujourd'hui. Les semaines déjà passées restent
          inchangées.
        </p>
      </div>

      <AvailabilityForm
        weeklyPattern={draft.weeklyPattern}
        restDays={draft.restDays ?? []}
        onChangeDay={setDay}
        onChangeRestDays={(restDays) => setDraft({ ...draft, restDays })}
      />

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => void navigate('/profile')} className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={!canSave} className="flex-1">
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
