import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { calculateAthleteZones } from '@/engine/calibration/calculateAthleteZones'
import type { Zone } from '@/engine/calibration/zones'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

function ZoneTable({ title, zones, unit }: { title: string; zones: Zone[]; unit: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-text-muted">{title}</p>
      <ul className="flex flex-col gap-1">
        {zones.map((zone) => (
          <li key={zone.name} className="flex justify-between text-xs">
            <span>
              {zone.name} · {zone.label}
            </span>
            <span className="text-text-muted">
              {zone.min}
              {zone.max === Infinity ? '+' : `–${zone.max}`} {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProfilePage() {
  const [showDetails, setShowDetails] = useState(false)
  const profile = AthleteProfileRepository.load()
  const raceGoal = RaceGoalRepository.load()

  if (!profile || !raceGoal) {
    return <PlaceholderPage title="Profil" description="Ton profil n'a pas encore été créé." />
  }

  const zones = calculateAthleteZones(profile.knownMetrics)
  const metrics = profile.knownMetrics

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton profil</h1>
        <p className="text-sm text-text-muted">
          Expérience {LEVEL_LABELS[profile.generalSportExperience]} · Natation{' '}
          {LEVEL_LABELS[profile.disciplineLevels.swim]} · Vélo{' '}
          {LEVEL_LABELS[profile.disciplineLevels.bike]} · Course{' '}
          {LEVEL_LABELS[profile.disciplineLevels.run]}
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Données de calibration</h2>

        <div className="flex items-center justify-between text-sm">
          <span>FTP vélo</span>
          <span className="text-text-muted">
            {metrics.ftpWatts ? `${metrics.ftpWatts} W` : 'Non renseignée'}
          </span>
        </div>
        <Link to="/profile/tests/ftp" className="text-xs text-accent underline">
          Faire un test FTP
        </Link>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span>CSS natation</span>
          <span className="text-text-muted">
            {metrics.cssSecPer100m ? `${metrics.cssSecPer100m} s/100m` : 'Non renseignée'}
          </span>
        </div>
        <Link to="/profile/tests/css" className="text-xs text-accent underline">
          Faire un test CSS
        </Link>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span>Allure seuil course</span>
          <span className="text-text-muted">
            {metrics.thresholdPaceSecPerKm ? `${metrics.thresholdPaceSecPerKm} s/km` : 'Non renseignée'}
          </span>
        </div>
        <Link to="/profile/tests/threshold" className="text-xs text-accent underline">
          Faire un test seuil
        </Link>
      </section>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="text-left text-sm font-medium text-accent underline"
      >
        {showDetails ? 'Masquer le détail des zones' : 'Voir le détail des zones'}
      </button>

      {showDetails && (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          {zones.heartRate && <ZoneTable title="Fréquence cardiaque" zones={zones.heartRate} unit="bpm" />}
          {zones.power && <ZoneTable title="Puissance vélo" zones={zones.power} unit="W" />}
          {zones.runPace && <ZoneTable title="Allure course" zones={zones.runPace} unit="s/km" />}
          {zones.swimPace && <ZoneTable title="Allure natation" zones={zones.swimPace} unit="s/100m" />}
          {!zones.heartRate && !zones.power && !zones.runPace && !zones.swimPace && (
            <p className="text-xs text-text-muted">
              Renseigne au moins une donnée connue (FC, FTP, CSS, allure seuil) pour voir tes
              zones calculées.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
