import { useState } from 'react'
import type { BiologicalSex } from '@/core/athlete/AthleteProfile'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import { MinSecField } from '@/shared/components/MinSecField'
import type { OnboardingDraft } from '../onboardingState'

const SEX_CHOICES: { value: BiologicalSex; label: string }[] = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
  { value: 'unspecified', label: 'Préfère ne pas préciser' },
]

interface MetricsStepProps {
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
}

function numberField(
  label: string,
  hint: string,
  value: number | undefined,
  onValue: (n: number | undefined) => void,
) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onValue(e.target.value === '' ? undefined : Number(e.target.value))}
        className={INPUT_CLASSES}
      />
    </Field>
  )
}

function secondsToMinSec(totalSeconds: number | undefined): { min: number | ''; sec: number | '' } {
  if (totalSeconds === undefined) return { min: '', sec: '' }
  return { min: Math.floor(totalSeconds / 60), sec: totalSeconds % 60 }
}

export function MetricsStep({ draft, onChange }: MetricsStepProps) {
  const metrics = draft.knownMetrics
  const setMetric = (patch: Partial<OnboardingDraft['knownMetrics']>) =>
    onChange({ knownMetrics: { ...metrics, ...patch } })

  // The draft only stores a combined seconds value, but the field is
  // minutes + seconds — keep the split representation in local state,
  // seeded from any value already set (e.g. navigating back to this step).
  const cssInitial = secondsToMinSec(metrics.cssSecPer100m)
  const [cssMin, setCssMin] = useState(cssInitial.min)
  const [cssSec, setCssSec] = useState(cssInitial.sec)
  const paceInitial = secondsToMinSec(metrics.thresholdPaceSecPerKm)
  const [paceMin, setPaceMin] = useState(paceInitial.min)
  const [paceSec, setPaceSec] = useState(paceInitial.sec)

  const updateCss = (min: number | '', sec: number | '') => {
    setCssMin(min)
    setCssSec(sec)
    setMetric({ cssSecPer100m: min === '' || sec === '' ? undefined : min * 60 + sec })
  }
  const updatePace = (min: number | '', sec: number | '') => {
    setPaceMin(min)
    setPaceSec(sec)
    setMetric({ thresholdPaceSecPerKm: min === '' || sec === '' ? undefined : min * 60 + sec })
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Tes données connues</h1>
        <p className="text-sm text-text-muted">
          Tout est optionnel — le programme démarre avec des estimations prudentes et tu pourras
          faire des tests plus tard pour affiner tes zones.
        </p>
      </div>

      {numberField(
        'FC max (bpm)',
        "Le nombre maximum de battements par minute que ton cœur atteint à l'effort maximal. Si tu ne la connais pas : une estimation grossière est 220 moins ton âge.",
        metrics.maxHeartRate,
        (v) => setMetric({ maxHeartRate: v }),
      )}

      {numberField(
        'FC seuil (bpm)',
        "La fréquence cardiaque au-delà de laquelle tu ne peux plus tenir l'effort que quelques minutes — le plus souvent 85 à 90 % de ta FC max.",
        metrics.thresholdHeartRate,
        (v) => setMetric({ thresholdHeartRate: v }),
      )}

      {draft.sport === 'triathlon' &&
        numberField(
          'FTP vélo (watts)',
          "La puissance moyenne que tu peux maintenir pendant environ une heure à vélo. Se mesure avec un capteur de puissance ou un test FTP (disponible plus tard dans ton profil).",
          metrics.ftpWatts,
          (v) => setMetric({ ftpWatts: v }),
        )}

      {draft.sport === 'triathlon' && (
        <MinSecField
          legend="CSS natation"
          idPrefix="onboarding-css"
          minutes={cssMin}
          seconds={cssSec}
          onMinutesChange={(v) => updateCss(v, cssSec)}
          onSecondsChange={(v) => updateCss(cssMin, v)}
          hint="Ton allure de nage soutenable indéfiniment, par 100m. Déterminée par un test 400m + 200m (disponible plus tard dans ton profil) si tu ne la connais pas déjà."
        />
      )}

      <MinSecField
        legend="Allure seuil course"
        idPrefix="onboarding-threshold-pace"
        minutes={paceMin}
        seconds={paceSec}
        onMinutesChange={(v) => updatePace(v, paceSec)}
        onSecondsChange={(v) => updatePace(paceMin, v)}
        hint="L'allure de course que tu peux tenir pendant environ une heure, par km."
      />

      <div className="mt-2 border-t border-border pt-5">
        <h2 className="text-sm font-semibold">Données personnelles</h2>
        <p className="mt-1 text-xs text-text-muted">
          Optionnel, et jamais utilisé pour un diagnostic : ton poids sert à calculer des repères
          nutritionnels (glucides/hydratation par heure) adaptés à toi plutôt que des fourchettes
          génériques, et ta puissance relative (W/kg) si tu renseignes ta FTP vélo.
        </p>
      </div>

      <ChoiceGroup
        legend="Sexe"
        name="sex"
        choices={SEX_CHOICES}
        value={draft.sex}
        onChange={(value) => onChange({ sex: value })}
      />

      {numberField(
        'Taille (cm)',
        'Utilisée pour ton profil — aucune séance ni recommandation n\'en dépend pour le moment.',
        draft.heightCm,
        (v) => onChange({ heightCm: v }),
      )}

      {numberField(
        'Poids (kg)',
        draft.sport === 'triathlon'
          ? 'Sert à calculer tes repères nutritionnels et ta puissance relative (W/kg) si ta FTP est connue.'
          : 'Sert à calculer tes repères nutritionnels (glucides/hydratation par heure).',
        draft.weightKg,
        (v) => onChange({ weightKg: v }),
      )}
    </div>
  )
}
