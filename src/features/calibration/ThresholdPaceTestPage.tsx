import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { computeThresholdPaceSecPerKm } from '@/engine/calibration/computeThresholdPaceFromTest'
import { Button } from '@/shared/components/Button'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

const TEST_DURATION_SEC = 20 * 60

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60)
  const sec = secPerKm % 60
  return `${min}:${String(sec).padStart(2, '0')}/km`
}

export function ThresholdPaceTestPage() {
  const navigate = useNavigate()
  const profile = AthleteProfileRepository.load()
  const [distanceMeters, setDistanceMeters] = useState<number | ''>('')
  const [result, setResult] = useState<{ before?: number; after: number } | null>(null)

  if (!profile) {
    return <PlaceholderPage title="Profil introuvable" description="Complète d'abord l'onboarding." />
  }

  const handleSubmit = () => {
    if (distanceMeters === '' || distanceMeters <= 0) return
    const after = computeThresholdPaceSecPerKm(distanceMeters, TEST_DURATION_SEC)
    const before = profile.knownMetrics.thresholdPaceSecPerKm
    AthleteProfileRepository.save({
      ...profile,
      knownMetrics: { ...profile.knownMetrics, thresholdPaceSecPerKm: after },
    })
    setResult({ before, after })
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <h1 className="text-lg font-semibold">Allure seuil mise à jour</h1>
        <p className="text-sm text-text-muted">
          {result.before ? `${formatPace(result.before)} → ` : ''}
          <span className="font-semibold text-text">{formatPace(result.after)}</span>
        </p>
        <Button onClick={() => void navigate('/profile', { replace: true })} className="w-full">
          Retour au profil
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Test seuil course (20 minutes)</h1>
        <p className="mt-2 text-sm text-text-muted">
          Échauffe-toi, puis cours le plus loin possible en 20 minutes à une intensité que tu
          pourrais tenir "confortablement difficile". Ton allure seuil est déduite de la distance
          parcourue.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Distance parcourue en 20 minutes (mètres)</span>
        <input
          type="number"
          min={0}
          value={distanceMeters}
          onChange={(e) => setDistanceMeters(e.target.value === '' ? '' : Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>

      <Button
        onClick={handleSubmit}
        disabled={distanceMeters === '' || distanceMeters <= 0}
        className="w-full"
      >
        Calculer mon allure seuil
      </Button>
    </div>
  )
}
