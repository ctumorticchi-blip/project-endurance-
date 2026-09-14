import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import type { Level } from '@/shared/types/common'
import type { RunningExperience, TriathlonExperience } from '@/core/athlete/AthleteProfile'
import type { OnboardingDraft } from '../onboardingState'

const LEVEL_CHOICES: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
]

const TRIATHLON_EXPERIENCE_CHOICES: { value: TriathlonExperience; label: string }[] = [
  { value: 'first-triathlon', label: 'Ce sera mon premier triathlon' },
  { value: 'some-races', label: 'J’ai déjà fait quelques courses' },
  { value: 'experienced', label: 'Je suis un triathlète expérimenté' },
]

const RUNNING_EXPERIENCE_CHOICES: { value: RunningExperience; label: string }[] = [
  { value: 'first-time-at-distance', label: 'Ce sera ma première fois sur cette distance' },
  { value: 'some-races', label: 'J’ai déjà couru quelques courses' },
  { value: 'experienced', label: 'Je suis un coureur expérimenté' },
]

interface ExperienceStepProps {
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
}

export function ExperienceStep({ draft, onChange }: ExperienceStepProps) {
  const isRunning = draft.sport === 'running'

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton expérience</h1>
        <p className="text-sm text-text-muted">
          Pour adapter le point de départ du programme — pas besoin d'être précis.
        </p>
      </div>

      <ChoiceGroup
        legend="Expérience sportive générale"
        name="generalSportExperience"
        choices={LEVEL_CHOICES}
        value={draft.generalSportExperience}
        onChange={(value) => onChange({ generalSportExperience: value })}
      />

      {isRunning ? (
        <ChoiceGroup
          legend="Expérience course à pied"
          name="runningExperience"
          choices={RUNNING_EXPERIENCE_CHOICES}
          value={draft.runningExperience}
          onChange={(value) => onChange({ runningExperience: value })}
        />
      ) : (
        <ChoiceGroup
          legend="Expérience triathlon"
          name="triathlonExperience"
          choices={TRIATHLON_EXPERIENCE_CHOICES}
          value={draft.triathlonExperience}
          onChange={(value) => onChange({ triathlonExperience: value })}
        />
      )}

      {!isRunning && (
        <>
          <ChoiceGroup
            legend="🏊 Niveau natation"
            name="swimLevel"
            choices={LEVEL_CHOICES}
            value={draft.swimLevel}
            onChange={(value) => onChange({ swimLevel: value })}
          />

          <ChoiceGroup
            legend="🚴 Niveau vélo"
            name="bikeLevel"
            choices={LEVEL_CHOICES}
            value={draft.bikeLevel}
            onChange={(value) => onChange({ bikeLevel: value })}
          />
        </>
      )}

      <ChoiceGroup
        legend="🏃 Niveau course à pied"
        name="runLevel"
        choices={LEVEL_CHOICES}
        value={draft.runLevel}
        onChange={(value) => onChange({ runLevel: value })}
      />

      <Field label="Volume hebdomadaire récent (heures) — optionnel">
        <input
          type="number"
          min={0}
          max={30}
          value={draft.recentWeeklyVolumeHours ?? ''}
          onChange={(e) =>
            onChange({
              recentWeeklyVolumeHours: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          className={INPUT_CLASSES}
        />
      </Field>
    </div>
  )
}
