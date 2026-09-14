import { daysUntilRace } from '@/core/goals/RaceGoal'
import type { SecondaryRaceGoal } from '@/core/goals/SecondaryRaceGoal'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'

interface UpcomingRacesProps {
  races: SecondaryRaceGoal[]
}

/** Secondary (B/C) races the athlete is tracking alongside the main
 * objective — purely informational, shown as a compact list right under
 * the main race countdown. Never influences the plan, see
 * `core/goals/SecondaryRaceGoal.ts`. */
export function UpcomingRaces({ races }: UpcomingRacesProps) {
  if (races.length === 0) return null

  return (
    <Card variant="muted" className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Autres courses à venir</p>
      <ul className="flex flex-col gap-1.5">
        {races.map((race) => (
          <li key={race.id} className="flex items-center justify-between gap-2 text-sm">
            <span>{race.raceName}</span>
            <Badge>J-{daysUntilRace(race.raceDate)}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}
