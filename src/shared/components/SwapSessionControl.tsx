import { useState } from 'react'
import type { Availability } from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName, TrainingWeek } from '@/core/training/TrainingPlan'
import { SWAPPABLE_DISCIPLINES, swapSessionDiscipline } from '@/sports/triathlon/planning/swapSessionDiscipline'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import type { Discipline } from '@/shared/types/common'
import { Button } from './Button'
import { ChoiceGroup } from './ChoiceGroup'

interface SwapSessionControlProps {
  session: PlannedSession
  week: TrainingWeek
  phase: TrainingPhaseName
  availability: Availability
  onSwapped: (newSession: PlannedSession) => void
}

/**
 * "It's raining, I'll swim instead of riding today" — lets the athlete
 * replace a session's discipline outright, effective immediately (brief
 * feedback). Only offers disciplines `swapSessionDiscipline` confirms
 * actually fit the day (available time, pool access), so confirming never
 * fails — there is nothing to pick that wouldn't work.
 */
export function SwapSessionControl({ session, week, phase, availability, onSwapped }: SwapSessionControlProps) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<Discipline>()

  const viableChoices = SWAPPABLE_DISCIPLINES.filter(
    (d) => swapSessionDiscipline(session, d, { phase, week, availability }) !== undefined,
  )

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

  if (viableChoices.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Aucune séance alternative ne convient aujourd'hui (temps disponible ou accès piscine).
      </p>
    )
  }

  const handleConfirm = () => {
    if (!choice) return
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
        choices={viableChoices.map((d) => ({ value: d, label: DISCIPLINE_LABELS[d] }))}
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
