import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCompletedSession } from '@/core/history/CompletedSession'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { createSessionFeedback, type PerceivedDifficulty } from '@/core/history/SessionFeedback'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { findSessionById } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { Button } from '@/shared/components/Button'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

const DIFFICULTY_CHOICES: { value: PerceivedDifficulty; label: string }[] = [
  { value: 'harder-than-expected', label: 'Plus dur que prévu' },
  { value: 'as-expected', label: 'Comme prévu' },
  { value: 'easier-than-expected', label: 'Plus facile que prévu' },
]

const RPE_VALUES = Array.from({ length: 10 }, (_, i) => i + 1)

export function CompletedFeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const plan = TrainingPlanRepository.load()
  const session = plan && sessionId ? findSessionById(plan, sessionId) : undefined

  const [actualDurationMin, setActualDurationMin] = useState(session?.estimatedDurationMin ?? 0)
  const [rpe, setRpe] = useState<number>()
  const [difficulty, setDifficulty] = useState<PerceivedDifficulty>()
  const [comment, setComment] = useState('')

  if (!session) {
    return <PlaceholderPage title="Séance introuvable" description="Impossible de retrouver cette séance." />
  }

  const canSubmit = rpe !== undefined && difficulty !== undefined

  const handleSubmit = () => {
    if (!canSubmit) return

    CompletedSessionRepository.append(
      createCompletedSession({ plannedSessionId: session.id, actualDurationMin }),
    )
    SessionFeedbackRepository.append(
      createSessionFeedback({
        plannedSessionId: session.id,
        outcome: 'completed',
        rpe,
        perceivedDifficulty: difficulty,
        comment: comment || undefined,
      }),
    )
    void navigate('/today', { replace: true })
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Comment s'est passée ta séance ?</h1>
        <p className="text-sm text-text-muted">{session.title}</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Durée réelle (minutes)</span>
        <input
          type="number"
          min={0}
          value={actualDurationMin}
          onChange={(e) => setActualDurationMin(Number(e.target.value))}
          className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">RPE (effort ressenti, 1-10)</legend>
        <div className="grid grid-cols-5 gap-2">
          {RPE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rpe === value}
              onClick={() => setRpe(value)}
              className={`rounded-lg border py-2 text-sm font-medium ${
                rpe === value ? 'border-primary bg-surface-muted text-primary' : 'border-border bg-surface'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <ChoiceGroup
        legend="Ressenti"
        name="difficulty"
        choices={DIFFICULTY_CHOICES}
        value={difficulty}
        onChange={setDifficulty}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Commentaire (optionnel)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
        Enregistrer
      </Button>
    </div>
  )
}
