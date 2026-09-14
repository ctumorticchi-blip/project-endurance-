import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { ReadinessCheckRepository } from '@/core/history/ReadinessCheckRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { AdaptationDecisionRepository } from '@/engine/adaptation/AdaptationDecisionRepository'
import { calculateAthleteZones } from '@/engine/calibration/calculateAthleteZones'
import type { Zone } from '@/engine/calibration/zones'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { formatPaceMinSec } from '@/shared/utils/pace'

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

function ZoneTable({
  title,
  zones,
  unit,
  formatValue = String,
}: {
  title: string
  zones: Zone[]
  unit: string
  /** Pace zones render "M:SS" bounds instead of a raw second count. */
  formatValue?: (value: number) => string
}) {
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
              {formatValue(zone.min)}
              {zone.max === Infinity ? '+' : `–${formatValue(zone.max)}`}
              {unit.startsWith('/') ? unit : ` ${unit}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const profile = AthleteProfileRepository.load()
  const raceGoal = RaceGoalRepository.load()

  if (!profile || !raceGoal) {
    return <PlaceholderPage title="Profil" description="Ton profil n'a pas encore été créé." />
  }

  const handleResetConfirmed = () => {
    AthleteProfileRepository.clear()
    RaceGoalRepository.clear()
    AvailabilityRepository.clear()
    TrainingPlanRepository.clear()
    CompletedSessionRepository.clear()
    SessionFeedbackRepository.clear()
    ReadinessCheckRepository.clear()
    AdaptationDecisionRepository.clear()
    void navigate('/onboarding', { replace: true })
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

      <Card className="flex flex-col gap-3">
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
            {metrics.cssSecPer100m ? formatPaceMinSec(metrics.cssSecPer100m, '/100m') : 'Non renseignée'}
          </span>
        </div>
        <Link to="/profile/tests/css" className="text-xs text-accent underline">
          Faire un test CSS
        </Link>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span>Allure seuil course</span>
          <span className="text-text-muted">
            {metrics.thresholdPaceSecPerKm
              ? formatPaceMinSec(metrics.thresholdPaceSecPerKm, '/km')
              : 'Non renseignée'}
          </span>
        </div>
        <Link to="/profile/tests/threshold" className="text-xs text-accent underline">
          Faire un test seuil
        </Link>
      </Card>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="text-left text-sm font-medium text-accent underline"
      >
        {showDetails ? 'Masquer le détail des zones' : 'Voir le détail des zones'}
      </button>

      {showDetails && (
        <Card className="flex flex-col gap-4">
          {zones.heartRate && <ZoneTable title="Fréquence cardiaque" zones={zones.heartRate} unit="bpm" />}
          {zones.power && <ZoneTable title="Puissance vélo" zones={zones.power} unit="W" />}
          {zones.runPace && (
            <ZoneTable
              title="Allure course"
              zones={zones.runPace}
              unit="/km"
              formatValue={(v) => formatPaceMinSec(v, '')}
            />
          )}
          {zones.swimPace && (
            <ZoneTable
              title="Allure natation"
              zones={zones.swimPace}
              unit="/100m"
              formatValue={(v) => formatPaceMinSec(v, '')}
            />
          )}
          {!zones.heartRate && !zones.power && !zones.runPace && !zones.swimPace && (
            <p className="text-xs text-text-muted">
              Renseigne au moins une donnée connue (FC, FTP, CSS, allure seuil) pour voir tes
              zones calculées.
            </p>
          )}
        </Card>
      )}

      <section className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
        {!confirmingReset ? (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="text-left text-sm font-medium text-danger underline"
          >
            Réinitialiser mon profil
          </button>
        ) : (
          <Card variant="muted" className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Ça supprime définitivement ton profil, ton programme, ton historique de séances et
              tes disponibilités — tu repartiras de zéro dans l'onboarding. Cette action est
              irréversible.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmingReset(false)} className="flex-1">
                Annuler
              </Button>
              <Button variant="danger" onClick={handleResetConfirmed} className="flex-1">
                Oui, tout réinitialiser
              </Button>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
