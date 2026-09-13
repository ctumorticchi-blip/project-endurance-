import { TRIATHLON_DISTANCES } from '@/sports/triathlon/domain/distance'
import { WEEKDAYS, type Weekday } from '@/shared/types/common'
import type { OnboardingDraft } from '../onboardingState'

const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Jeu',
  friday: 'Ven',
  saturday: 'Sam',
  sunday: 'Dim',
}

interface ReviewStepProps {
  draft: OnboardingDraft
}

export function ReviewStep({ draft }: ReviewStepProps) {
  const availableDays = WEEKDAYS.filter((d) => draft.weeklyPattern[d].available)
  const totalMinutes = availableDays.reduce((sum, d) => sum + draft.weeklyPattern[d].minutes, 0)

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Vérifie ton profil</h1>
        <p className="text-sm text-text-muted">
          Ton programme complet sera généré à partir de ces informations.
        </p>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between border-b border-border pb-2">
          <dt className="text-text-muted">Objectif</dt>
          <dd>
            {draft.distance ? TRIATHLON_DISTANCES[draft.distance].label : '—'} le {draft.raceDate}
          </dd>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <dt className="text-text-muted">Niveaux</dt>
          <dd>
            Nat. {draft.swimLevel} · Vélo {draft.bikeLevel} · Course {draft.runLevel}
          </dd>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <dt className="text-text-muted">Disponibilités</dt>
          <dd>
            {availableDays.length} jour{availableDays.length > 1 ? 's' : ''} ·{' '}
            {Math.round(totalMinutes / 60)} h/semaine
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Jours</dt>
          <dd>{availableDays.map((d) => WEEKDAY_LABELS[d]).join(', ') || '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
