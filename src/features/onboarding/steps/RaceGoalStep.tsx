import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import { TRIATHLON_DISTANCES, type TriathlonDistance } from '@/sports/triathlon/domain/distance'
import { weeksUntilRace } from '@/core/goals/RaceGoal'
import type { OnboardingDraft } from '../onboardingState'

const DISTANCE_CHOICES = (Object.keys(TRIATHLON_DISTANCES) as TriathlonDistance[]).map((key) => {
  const spec = TRIATHLON_DISTANCES[key]
  return {
    value: key,
    label: spec.label,
    hint: `${spec.swimMeters} m · ${spec.bikeKm} km · ${spec.runKm} km`,
  }
})

interface RaceGoalStepProps {
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
}

export function RaceGoalStep({ draft, onChange }: RaceGoalStepProps) {
  const weeks = draft.raceDate ? weeksUntilRace(draft.raceDate) : undefined
  const spec = draft.distance ? TRIATHLON_DISTANCES[draft.distance] : undefined
  const tooSoon =
    spec && weeks !== undefined && weeks >= 0 && weeks < spec.recommendedMinWeeksBeginner

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton objectif</h1>
        <p className="text-sm text-text-muted">Sur quelle distance et pour quand ?</p>
      </div>

      <ChoiceGroup
        legend="Distance"
        name="distance"
        choices={DISTANCE_CHOICES}
        value={draft.distance}
        onChange={(value) => onChange({ distance: value })}
      />

      <Field label="Date de la course">
        <input
          type="date"
          value={draft.raceDate ?? ''}
          onChange={(e) => onChange({ raceDate: e.target.value })}
          className={INPUT_CLASSES}
        />
      </Field>

      {tooSoon && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-warning/10 px-3 py-2 text-xs text-warning">
          Attention : {weeks} semaine{weeks === 1 ? '' : 's'} avant la course, c'est court pour un{' '}
          {spec?.label}. Le programme te préviendra si le rythme devient trop agressif.
        </p>
      )}
    </div>
  )
}
