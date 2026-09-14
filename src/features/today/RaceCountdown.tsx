import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'

const RACE_WEEK_THRESHOLD_DAYS = 7

interface RaceCountdownProps {
  raceLabel: string
  daysUntilRace: number
}

/** The hero of Today: race distance + countdown, always visible first —
 * "premium hierarchy" per M1.1 means the thing the athlete cares about
 * most (how close is race day) is the biggest thing on screen. */
export function RaceCountdown({ raceLabel, daysUntilRace }: RaceCountdownProps) {
  const isRaceWeek = daysUntilRace <= RACE_WEEK_THRESHOLD_DAYS
  return (
    <Card variant="raised" className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
          Triathlon {raceLabel}
        </p>
        <p className="text-3xl font-bold tabular-nums">J-{daysUntilRace}</p>
      </div>
      <Badge tone={isRaceWeek ? 'warning' : 'accent'}>
        {isRaceWeek ? 'Semaine de course' : 'Avant la course'}
      </Badge>
    </Card>
  )
}
