import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { computeCssSecPer100m } from '@/engine/calibration/computeCssFromTest'
import { Button } from '@/shared/components/Button'
import { MinSecField } from '@/shared/components/MinSecField'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { formatPaceMinSec } from '@/shared/utils/pace'

function toTotalSeconds(minutes: number | '', seconds: number | ''): number | undefined {
  if (minutes === '' || seconds === '') return undefined
  const total = minutes * 60 + seconds
  return total > 0 ? total : undefined
}

export function CssTestPage() {
  const navigate = useNavigate()
  const profile = AthleteProfileRepository.load()
  const [min400, setMin400] = useState<number | ''>('')
  const [sec400, setSec400] = useState<number | ''>('')
  const [min200, setMin200] = useState<number | ''>('')
  const [sec200, setSec200] = useState<number | ''>('')
  const [result, setResult] = useState<{ before?: number; after: number } | null>(null)
  const [error, setError] = useState<string>()

  if (!profile) {
    return <PlaceholderPage title="Profil introuvable" description="Complète d'abord l'onboarding." />
  }

  const time400 = toTotalSeconds(min400, sec400)
  const time200 = toTotalSeconds(min200, sec200)
  const canSubmit = time400 !== undefined && time200 !== undefined

  const handleSubmit = () => {
    if (time400 === undefined || time200 === undefined) return
    setError(undefined)
    try {
      const after = computeCssSecPer100m(400, time400, 200, time200)
      const before = profile.knownMetrics.cssSecPer100m
      AthleteProfileRepository.save({
        ...profile,
        knownMetrics: { ...profile.knownMetrics, cssSecPer100m: after },
      })
      setResult({ before, after })
    } catch {
      setError('Le 400m doit être plus lent (en temps total) que le 200m. Vérifie tes temps.')
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <h1 className="text-lg font-semibold">CSS mise à jour</h1>
        <p className="text-sm text-text-muted">
          {result.before ? `${formatPaceMinSec(result.before, '/100m')} → ` : ''}
          <span className="font-semibold text-text">{formatPaceMinSec(result.after, '/100m')}</span>
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
        <h1 className="text-lg font-semibold">Test CSS (400m + 200m)</h1>
        <p className="mt-2 text-sm text-text-muted">
          Nage un 400m le plus vite possible, récupère 5 minutes, puis nage un 200m le plus vite
          possible. Ta CSS est l'allure que tu peux tenir indéfiniment, déduite de l'écart entre
          les deux temps.
        </p>
      </div>

      <MinSecField
        legend="Temps du 400m"
        idPrefix="time-400"
        minutes={min400}
        seconds={sec400}
        onMinutesChange={setMin400}
        onSecondsChange={setSec400}
      />

      <MinSecField
        legend="Temps du 200m"
        idPrefix="time-200"
        minutes={min200}
        seconds={sec200}
        onMinutesChange={setMin200}
        onSecondsChange={setSec200}
      />

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
        Calculer ma CSS
      </Button>
    </div>
  )
}
