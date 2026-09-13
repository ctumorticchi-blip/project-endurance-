import { WEEKDAYS, type Weekday } from '@/shared/types/common'
import type { OnboardingDraft } from '../onboardingState'

const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

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
          des exceptions ponctuelles plus tard.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {WEEKDAYS.map((day) => {
          const dayState = draft.weeklyPattern[day]
          return (
            <li key={day} className="rounded-lg border border-border bg-surface px-3 py-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dayState.available}
                  onChange={(e) => setDay(day, { available: e.target.checked })}
                />
                <span className="w-24 text-sm font-medium">{WEEKDAY_LABELS[day]}</span>
                {dayState.available && (
                  <>
                    <input
                      type="number"
                      min={0}
                      max={480}
                      step={5}
                      aria-label={`Minutes disponibles le ${WEEKDAY_LABELS[day]}`}
                      value={dayState.minutes || ''}
                      onChange={(e) => setDay(day, { minutes: Number(e.target.value) || 0 })}
                      className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-text-muted">min</span>
                  </>
                )}
              </label>
              {dayState.available && (
                <label className="mt-2 ml-9 flex items-center gap-2 text-xs text-text-muted">
                  <input
                    type="checkbox"
                    checked={dayState.poolAccess}
                    onChange={(e) => setDay(day, { poolAccess: e.target.checked })}
                  />
                  Piscine accessible ce jour-là
                </label>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
