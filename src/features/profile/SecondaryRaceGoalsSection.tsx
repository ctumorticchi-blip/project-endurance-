import { useState } from 'react'
import { daysUntilRace } from '@/core/goals/RaceGoal'
import { createSecondaryRaceGoal } from '@/core/goals/SecondaryRaceGoal'
import { SecondaryRaceGoalRepository } from '@/core/goals/SecondaryRaceGoalRepository'
import { TRIATHLON_DISTANCES, type TriathlonDistance } from '@/sports/triathlon/domain/distance'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import { toISODate } from '@/shared/utils/date'

type DistanceChoice = TriathlonDistance | 'unspecified'

const DISTANCE_CHOICES: { value: DistanceChoice; label: string }[] = [
  ...(Object.keys(TRIATHLON_DISTANCES) as TriathlonDistance[]).map((value) => ({
    value,
    label: TRIATHLON_DISTANCES[value].label,
  })),
  { value: 'unspecified', label: 'Non précisée' },
]

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * Courses B/C que l'athlète veut juste suivre à côté de l'objectif
 * principal — purement informatif (brief feedback : ne modifie jamais la
 * périodisation du programme, voir `SecondaryRaceGoal`).
 */
export function SecondaryRaceGoalsSection() {
  const [races, setRaces] = useState(() => SecondaryRaceGoalRepository.loadAll())
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [distance, setDistance] = useState<DistanceChoice>()

  const today = toISODate(new Date())
  const sorted = [...races].sort((a, b) => (a.raceDate < b.raceDate ? -1 : a.raceDate > b.raceDate ? 1 : 0))
  const canAdd = name.trim().length > 0 && date.length > 0

  const resetForm = () => {
    setAdding(false)
    setName('')
    setDate('')
    setDistance(undefined)
  }

  const handleAdd = () => {
    if (!canAdd) return
    SecondaryRaceGoalRepository.append(
      createSecondaryRaceGoal({
        raceName: name.trim(),
        raceDate: date,
        distance: distance && distance !== 'unspecified' ? distance : undefined,
      }),
    )
    setRaces(SecondaryRaceGoalRepository.loadAll())
    resetForm()
  }

  const handleRemove = (id: string) => {
    const remaining = races.filter((r) => r.id !== id)
    SecondaryRaceGoalRepository.replaceAll(remaining)
    setRaces(remaining)
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Autres courses</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs font-medium text-accent underline"
          >
            Ajouter
          </button>
        )}
      </div>
      <p className="text-xs text-text-muted">
        Des courses B/C juste pour le suivi — elles n'influencent pas ton programme, qui continue de
        viser ta course principale sans changement.
      </p>

      {sorted.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sorted.map((race) => {
            const isPast = race.raceDate < today
            return (
              <li key={race.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{race.raceName}</p>
                  <p className="text-xs text-text-muted">
                    {formatDate(race.raceDate)}
                    {race.distance ? ` · ${TRIATHLON_DISTANCES[race.distance].label}` : ''}
                    {isPast ? ' · Passée' : ` · J-${daysUntilRace(race.raceDate)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(race.id)}
                  className="shrink-0 text-xs font-medium text-danger underline"
                >
                  Supprimer
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {adding && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-border bg-surface p-3">
          <Field label="Nom de la course">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASSES}
              placeholder="Ex. Triathlon de..."
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT_CLASSES}
            />
          </Field>
          <ChoiceGroup
            legend="Distance (optionnel)"
            name="secondary-race-distance"
            choices={DISTANCE_CHOICES}
            value={distance}
            onChange={setDistance}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={resetForm} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!canAdd} className="flex-1">
              Ajouter
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
