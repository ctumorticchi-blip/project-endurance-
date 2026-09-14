import { AvailabilityForm } from '@/features/availability/AvailabilityForm'
import type { Weekday } from '@/shared/types/common'
import type { OnboardingDraft } from '../onboardingState'

interface AvailabilityStepProps {
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
}

export function AvailabilityStep({ draft, onChange }: AvailabilityStepProps) {
  const setDay = (day: Weekday, patch: Partial<OnboardingDraft['weeklyPattern'][Weekday]>) => {
    onChange({
      weeklyPattern: {
        ...draft.weeklyPattern,
        [day]: { ...draft.weeklyPattern[day], ...patch },
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ta semaine type</h1>
        <p className="text-sm text-text-muted">
          Indique tes jours disponibles et le temps que tu peux y consacrer. Tu pourras signaler
          des exceptions ponctuelles plus tard, et revenir modifier tout ceci depuis ton profil.
        </p>
      </div>

      <AvailabilityForm
        weeklyPattern={draft.weeklyPattern}
        restDays={draft.restDays}
        onChangeDay={setDay}
        onChangeRestDays={(restDays) => onChange({ restDays })}
        showPoolAccess={draft.sport === 'triathlon'}
      />
    </div>
  )
}
