import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { createSessionFeedback, type MissedReason } from '@/core/history/SessionFeedback'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { findSessionById } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import type { AdaptationDecision } from '@/engine/adaptation/AdaptationDecision'
import { AdaptationDecisionRepository } from '@/engine/adaptation/AdaptationDecisionRepository'
import {
  applyDurationAdaptation,
  removeSessionFromPlan,
  replaceSessionInPlan,
} from '@/engine/adaptation/applyAdaptationToPlan'
import { decideAdaptation } from '@/engine/adaptation/decideAdaptation'
import { computeUpcomingSlots } from '@/engine/adaptation/upcomingAvailability'
import { Button } from '@/shared/components/Button'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

const REASON_CHOICES: { value: MissedReason; label: string }[] = [
  { value: 'time', label: 'Manque de temps' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'pain', label: 'Douleur' },
  { value: 'unexpected', label: 'Imprévu' },
  { value: 'weather', label: 'Météo' },
  { value: 'equipment', label: 'Matériel' },
  { value: 'other', label: 'Autre' },
]

export function MissedSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const plan = TrainingPlanRepository.load()
  const session = plan && sessionId ? findSessionById(plan, sessionId) : undefined

  const [reason, setReason] = useState<MissedReason>()
  const [comment, setComment] = useState('')
  const [outcome, setOutcome] = useState<AdaptationDecision | null>(null)

  // Checked before the "session not found" guard below: a REMOVE decision
  // deletes the session from the plan, so by the time this re-renders with
  // `outcome` set, `findSessionById` would otherwise (wrongly) report it
  // as missing instead of showing the result screen.
  if (outcome) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <h1 className="text-lg font-semibold">Programme mis à jour</h1>
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-muted">
          {outcome.explanation}
        </p>
        <Button onClick={() => void navigate('/today', { replace: true })} className="w-full">
          Retour à Aujourd'hui
        </Button>
      </div>
    )
  }

  if (!session || !plan) {
    return <PlaceholderPage title="Séance introuvable" description="Impossible de retrouver cette séance." />
  }

  const handleSubmit = () => {
    if (!reason) return

    SessionFeedbackRepository.append(
      createSessionFeedback({
        plannedSessionId: session.id,
        outcome: 'missed',
        missedReason: reason,
        comment: comment || undefined,
      }),
    )

    const availability = AvailabilityRepository.load()
    const upcomingAvailability = availability
      ? computeUpcomingSlots({ availability, plan, fromDateExclusive: session.date })
      : []

    const decision = decideAdaptation({
      session,
      recentFeedback: [],
      missedReason: reason,
      upcomingAvailability,
    })
    AdaptationDecisionRepository.append(decision)

    if (decision.type === 'REMOVE') {
      TrainingPlanRepository.save(removeSessionFromPlan(plan, session.id))
    } else if (decision.type === 'MOVE' || decision.type === 'REPLACE') {
      TrainingPlanRepository.save(replaceSessionInPlan(plan, applyDurationAdaptation(session, decision)))
    }

    setOutcome(decision)
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Séance non réalisée</h1>
        <p className="text-sm text-text-muted">{session.title}</p>
      </div>

      <ChoiceGroup
        legend="Pourquoi ?"
        name="missedReason"
        choices={REASON_CHOICES}
        value={reason}
        onChange={setReason}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Précision (optionnel)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>

      <p className="text-xs text-text-muted">
        Pas d'inquiétude : ton programme ne va pas empiler cette séance en plus des suivantes.
      </p>

      <Button onClick={handleSubmit} disabled={!reason} className="w-full">
        Confirmer
      </Button>
    </div>
  )
}
