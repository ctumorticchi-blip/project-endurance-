import { useState } from 'react'
import type { Availability } from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName, TrainingWeek } from '@/core/training/TrainingPlan'
import { findMoveCandidateDays, moveSessionToDay } from '@/sports/triathlon/planning/moveSessionWithinWeek'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import type { DateISO } from '@/shared/types/common'

interface RestDayMovePromptProps {
  cancelledSession: PlannedSession
  week: TrainingWeek
  phase: TrainingPhaseName
  availability: Availability
  planEndDateExclusive: DateISO
  onResolved: (movedSession: PlannedSession | undefined) => void
}

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
}

/**
 * Shown right after "Repos" is confirmed via SwapSessionControl — the
 * session is already removed by the time this renders. Asked every time
 * rather than assumed (brief feedback), because whether it's worth
 * shifting the cancelled stimulus to another day depends on the week, not
 * on a fixed rule.
 */
export function RestDayMovePrompt({
  cancelledSession,
  week,
  phase,
  availability,
  planEndDateExclusive,
  onResolved,
}: RestDayMovePromptProps) {
  const [choice, setChoice] = useState<DateISO>()
  const candidates = findMoveCandidateDays(cancelledSession, week, availability, planEndDateExclusive)

  const handleMove = () => {
    if (!choice) return
    const moved = moveSessionToDay(cancelledSession, choice, { phase, week, availability })
    onResolved(moved)
  }

  return (
    <Card variant="raised" className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Jour de repos ajouté</h2>
        <p className="mt-1 text-sm text-text-muted">
          « {cancelledSession.title} » n'aura pas lieu aujourd'hui. Veux-tu la déplacer sur un
          autre jour cette semaine, ou la laisser de côté ?
        </p>
      </div>

      {candidates.length > 0 ? (
        <>
          <ChoiceGroup
            legend="Déplacer sur"
            name="move-to-day"
            choices={candidates.map((c) => ({ value: c.date, label: formatDate(c.date) }))}
            value={choice}
            onChange={setChoice}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onResolved(undefined)} className="flex-1">
              Ne pas déplacer
            </Button>
            <Button onClick={handleMove} disabled={!choice} className="flex-1">
              Déplacer
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-text-muted">
            Aucun autre jour disponible cette semaine pour déplacer cette séance.
          </p>
          <Button onClick={() => onResolved(undefined)} className="w-full">
            OK
          </Button>
        </>
      )}
    </Card>
  )
}
