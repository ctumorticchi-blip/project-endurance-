import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import type { OnboardingDraft } from '../onboardingState'

interface MetricsStepProps {
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
}

function numberField(
  label: string,
  value: number | undefined,
  onValue: (n: number | undefined) => void,
  unit?: string,
) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">
        {label} {unit && <span className="text-text-muted">({unit})</span>}
      </span>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onValue(e.target.value === '' ? undefined : Number(e.target.value))}
        className={INPUT_CLASSES}
      />
    </label>
  )
}

export function MetricsStep({ draft, onChange }: MetricsStepProps) {
  const metrics = draft.knownMetrics

  const setMetric = (patch: Partial<OnboardingDraft['knownMetrics']>) =>
    onChange({ knownMetrics: { ...metrics, ...patch } })

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Tes données connues</h1>
        <p className="text-sm text-text-muted">
          Tout est optionnel — le programme démarre avec des estimations prudentes et tu pourras
          faire des tests plus tard pour affiner tes zones.
        </p>
      </div>

      {numberField('FC max', metrics.maxHeartRate, (v) => setMetric({ maxHeartRate: v }), 'bpm')}
      {numberField(
        'FC seuil',
        metrics.thresholdHeartRate,
        (v) => setMetric({ thresholdHeartRate: v }),
        'bpm',
      )}
      {numberField('FTP vélo', metrics.ftpWatts, (v) => setMetric({ ftpWatts: v }), 'watts')}
      {numberField(
        'CSS natation',
        metrics.cssSecPer100m,
        (v) => setMetric({ cssSecPer100m: v }),
        'sec/100m',
      )}
      {numberField(
        'Allure seuil course',
        metrics.thresholdPaceSecPerKm,
        (v) => setMetric({ thresholdPaceSecPerKm: v }),
        'sec/km',
      )}
    </div>
  )
}
