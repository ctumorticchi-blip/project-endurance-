import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { computeCssSecPer100m } from '@/engine/calibration/computeCssFromTest'
import { Button } from '@/shared/components/Button'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

export function CssTestPage() {
  const navigate = useNavigate()
  const profile = AthleteProfileRepository.load()
  const [time400, setTime400] = useState<number | ''>('')
  const [time200, setTime200] = useState<number | ''>('')
  const [result, setResult] = useState<{ before?: number; after: number } | null>(null)
  const [error, setError] = useState<string>()

  if (!profile) {
    return <PlaceholderPage title="Profil introuvable" description="Complète d'abord l'onboarding." />
  }

  const canSubmit = time400 !== '' && time200 !== '' && time400 > 0 && time200 > 0

  const handleSubmit = () => {
    if (!canSubmit) return
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
          {result.before ? `${result.before} s/100m → ` : ''}
          <span className="font-semibold text-text">{result.after} s/100m</span>
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

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Temps du 400m (secondes)</span>
        <input
          type="number"
          min={0}
          value={time400}
          onChange={(e) => setTime400(e.target.value === '' ? '' : Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Temps du 200m (secondes)</span>
        <input
          type="number"
          min={0}
          value={time200}
          onChange={(e) => setTime200(e.target.value === '' ? '' : Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>

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
