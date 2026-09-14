import { useState } from 'react'
import type { Availability } from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName, TrainingWeek } from '@/core/training/TrainingPlan'
import { SWAPPABLE_DISCIPLINES, swapSessionDiscipline } from '@/sports/triathlon/planning/swapSessionDiscipline'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import type { Discipline } from '@/shared/types/common'
import { Button } from './Button'
import { ChoiceGroup } from './ChoiceGroup'

type SwapChoice = Discipline | 'rest'

interface SwapSessionControlProps {
  session: PlannedSession
  week: TrainingWeek
  phase: TrainingPhaseName
  availability: Availability
  onSwapped: (newSession: PlannedSession) => void
  /** Called when the athlete picks "Repos" and confirms — the caller
   * removes the session and then decides whether to offer moving it to
   * another day this week (brief feedback: ask each time, don't guess). */
  onConvertedToRest: () => void
}

/**
 * "It's raining, I'll swim instead of riding today" — lets the athlete
 * replace a session's discipline outright, effective immediately (brief
 * feedback). Also offers "Repos" as an option distinct from every actual
 * discipline: it always fits (no time/pool constraint), so it's never
 * filtered out the way a genuine discipline swap can be.
 */
export function SwapSessionControl({
  session,
  week,
  phase,
  availability,
  onSwapped,
  onConvertedToRest,
}: SwapSessionControlProps) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<SwapChoice>()

  const viableDisciplines = SWAPPABLE_DISCIPLINES.filter(
    (d) => swapSessionDiscipline(session, d, { phase, week, availability }) !== undefined,
  )
  const choices: { value: SwapChoice; label: string }[] = [
    ...viableDisciplines.map((d) => ({ value: d, label: DISCIPLINE_LABELS[d] })),
    { value: 'rest', label: 'Repos' },
  ]

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-center text-xs text-text-muted underline"
      >
        Changer de séance
      </button>
    )
  }

  const handleConfirm = () => {
    if (!choice) return
    if (choice === 'rest') {
      onConvertedToRest()
      setOpen(false)
      setChoice(undefined)
      return
    }
    const result = swapSessionDiscipline(session, choice, { phase, week, availability })
    if (!result) return
    onSwapped(result)
    setOpen(false)
    setChoice(undefined)
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-border bg-surface p-3">
      <ChoiceGroup
        legend="Remplacer par"
        name="swap-discipline"
        choices={choices}
        value={choice}
        onChange={setChoice}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(false)
            setChoice(undefined)
          }}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button onClick={handleConfirm} disabled={!choice} className="flex-1">
          Confirmer
        </Button>
      </div>
    </div>
  )
}
