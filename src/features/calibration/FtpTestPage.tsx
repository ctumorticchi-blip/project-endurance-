import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { computeFtpFromTwentyMinuteTest } from '@/engine/calibration/computeFtpFromTest'
import { Button } from '@/shared/components/Button'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

export function FtpTestPage() {
  const navigate = useNavigate()
  const profile = AthleteProfileRepository.load()
  const [avgWatts, setAvgWatts] = useState<number | ''>('')
  const [result, setResult] = useState<{ before?: number; after: number } | null>(null)

  if (!profile) {
    return <PlaceholderPage title="Profil introuvable" description="Complète d'abord l'onboarding." />
  }

  const handleSubmit = () => {
    if (avgWatts === '' || avgWatts <= 0) return
    const after = computeFtpFromTwentyMinuteTest(avgWatts)
    const before = profile.knownMetrics.ftpWatts
    AthleteProfileRepository.save({
      ...profile,
      knownMetrics: { ...profile.knownMetrics, ftpWatts: after },
    })
    setResult({ before, after })
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <h1 className="text-lg font-semibold">FTP mise à jour</h1>
        <p className="text-sm text-text-muted">
          {result.before ? `${result.before} W → ` : ''}
          <span className="font-semibold text-text">{result.after} W</span>
        </p>
        <p className="max-w-xs text-xs text-text-muted">
          Tes zones de puissance vélo sont recalculées automatiquement à partir de cette valeur.
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
        <h1 className="text-lg font-semibold">Test FTP (20 minutes)</h1>
        <p className="mt-2 text-sm text-text-muted">
          Échauffe-toi, puis roule à la puissance la plus élevée que tu peux tenir pendant 20
          minutes. Ta FTP est estimée à 95 % de ta puissance moyenne sur ce test — une
          approximation standard, pas une mesure de laboratoire.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Puissance moyenne sur les 20 minutes (watts)</span>
        <input
          type="number"
          min={0}
          value={avgWatts}
          onChange={(e) => setAvgWatts(e.target.value === '' ? '' : Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>

      <Button onClick={handleSubmit} disabled={avgWatts === '' || avgWatts <= 0} className="w-full">
        Calculer ma FTP
      </Button>
    </div>
  )
}
