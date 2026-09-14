import { Card } from '@/shared/components/Card'
import { CheckboxGroup } from '@/shared/components/CheckboxGroup'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import { WEEKDAYS, type Weekday } from '@/shared/types/common'
import type { DayAvailability, WeeklyPattern } from '@/core/availability/Availability'
import { WEEKDAY_LABELS } from './weekdayLabels'

// Distinct accessible names from the per-day availability checkboxes below
// (also labeled just "Lundi", "Mardi"...) — two checkboxes sharing the
// name "Lundi" would be ambiguous for screen readers and for anything
// selecting by accessible name.
const REST_DAY_CHOICES = WEEKDAYS.map((value) => ({
  value,
  label: `Repos le ${WEEKDAY_LABELS[value]}`,
}))

interface AvailabilityFormProps {
  weeklyPattern: WeeklyPattern
  restDays: Weekday[]
  onChangeDay: (day: Weekday, patch: Partial<DayAvailability>) => void
  onChangeRestDays: (restDays: Weekday[]) => void
}

/** The day-by-day availability + explicit rest-day picker, shared between
 * onboarding's AvailabilityStep and the later "Modifier mes
 * disponibilités" screen — same fields, same behavior, edited at two
 * different points in the athlete's journey (brief feedback: "au début ou
 * pendant"). */
export function AvailabilityForm({
  weeklyPattern,
  restDays,
  onChangeDay,
  onChangeRestDays,
}: AvailabilityFormProps) {
  return (
    <>
      <CheckboxGroup
        legend="Ton/tes jour(s) de repos fixe(s) — au moins un"
        choices={REST_DAY_CHOICES}
        value={restDays}
        onChange={onChangeRestDays}
      />
      <p className="-mt-2 text-xs text-text-muted">
        Ce(s) jour(s) ne recevront jamais de séance, même s'ils sont aussi marqués disponibles
        ci-dessous. Le repos fait partie de l'entraînement.
      </p>

      <ul className="flex flex-col gap-3">
        {WEEKDAYS.map((day) => {
          const dayState = weeklyPattern[day]
          return (
            <Card key={day} as="li" className="py-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dayState.available}
                  onChange={(e) => onChangeDay(day, { available: e.target.checked })}
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
                      onChange={(e) => onChangeDay(day, { minutes: Number(e.target.value) || 0 })}
                      className={`w-20 px-2 py-1 ${INPUT_CLASSES}`}
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
                    onChange={(e) => onChangeDay(day, { poolAccess: e.target.checked })}
                  />
                  Piscine accessible ce jour-là
                </label>
              )}
            </Card>
          )
        })}
      </ul>
    </>
  )
}
