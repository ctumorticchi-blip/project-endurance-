import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createSessionFeedback, type MissedReason } from '@/core/history/SessionFeedback'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { findSessionById } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { Button } from '@/shared/components/Button'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

const REASON_CHOICES: { value: MissedReason; label: string }[] = [
  { value: 'time', label: "Manque de temps" },
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

  if (!session) {
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
    void navigate('/today', { replace: true })
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
