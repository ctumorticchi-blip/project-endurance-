import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgressionStateRepository } from '@/core/coaching/ProgressionStateRepository'
import { createInitialProgressionState, type ProgressionResponse } from '@/core/coaching/progressionState'
import { createCompletedSession } from '@/core/history/CompletedSession'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { createSessionFeedback, type PerceivedDifficulty } from '@/core/history/SessionFeedback'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { findSessionById } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { processSessionFeedback } from '@/engine/progression/processSessionFeedback'
import { getFamilyForSession } from '@/sports/triathlon/coaching/workoutFamilies'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ChoiceGroup } from '@/shared/components/ChoiceGroup'
import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { ProgressionDecisionCard } from '@/shared/components/ProgressionDecisionCard'

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
  // Set once feedback is saved and a progression decision was actually
  // reached (brief §31/§38: "why did my coach change it" applies to the
  // *next* prescription too, not only to today's real-life adjustments) —
  // shown as a brief confirmation before returning to Today, not silently
  // discarded the way it was before this fix.
  const [progressionResponse, setProgressionResponse] = useState<ProgressionResponse>()
  const [progressionContext, setProgressionContext] = useState<{ previousLevel: number; maxLevel: number }>()

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

    // Training Intelligence V2: record this exposure against the session's
    // workout family and let the progression engine decide what the next
    // exposure should target — see engine/progression/processSessionFeedback.ts.
    const family = getFamilyForSession(session.discipline, session.sessionType)
    if (family) {
      const currentState = ProgressionStateRepository.loadByFamilyId(family.id) ?? createInitialProgressionState(family.id)
      const { nextState, response } = processSessionFeedback({
        session,
        outcome: 'completed',
        actualRpe: rpe,
        family,
        currentState,
        recentFeedback: SessionFeedbackRepository.loadAll(),
      })
      ProgressionStateRepository.save(nextState)
      setProgressionResponse(response)
      setProgressionContext({ previousLevel: currentState.currentLevel, maxLevel: family.progressionLevels })
      return
    }

    void navigate('/today', { replace: true })
  }

  if (progressionResponse) {
    return (
      <div className="flex flex-col gap-5 px-4 py-6">
        <Card variant="raised" className="glow-card flex flex-col items-center gap-1 py-8 text-center">
          <p aria-hidden="true" className="text-4xl">
            🎉
          </p>
          <h2 className="text-lg font-semibold">Séance enregistrée</h2>
        </Card>

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-primary uppercase">Pour la prochaine fois</p>
          <ProgressionDecisionCard
            response={progressionResponse}
            previousLevel={progressionContext?.previousLevel ?? 0}
            maxLevel={progressionContext?.maxLevel}
          />
        </div>

        <Button onClick={() => void navigate('/today', { replace: true })} className="w-full">
          Continuer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Comment s'est passée ta séance ?</h1>
        <p className="text-sm text-text-muted">{session.title}</p>
      </div>

      <Field label="Durée réelle (minutes)">
        <input
          type="number"
          min={0}
          value={actualDurationMin}
          onChange={(e) => setActualDurationMin(Number(e.target.value))}
          className={`w-24 ${INPUT_CLASSES}`}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">RPE (effort ressenti, 1-10)</legend>
        <div className="grid grid-cols-5 gap-2">
          {RPE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rpe === value}
              onClick={() => setRpe(value)}
              className={`rounded-[var(--radius-sm)] border py-2 text-sm font-medium ${
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

      <Field label="Commentaire (optionnel)">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className={INPUT_CLASSES}
        />
      </Field>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
        Enregistrer
      </Button>
    </div>
  )
}
