import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { findSessionById } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { Button } from '@/shared/components/Button'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { ProgressBar } from '@/shared/components/ProgressBar'
import { flattenSessionSteps } from './flattenSessionSteps'
import { StepPlayer } from './StepPlayer'

const DISCIPLINE_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
  strength: 'Renforcement',
  mobility: 'Mobilité',
  brick: 'Brick',
}

export function SessionPlayerPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const plan = TrainingPlanRepository.load()
  const session = plan && sessionId ? findSessionById(plan, sessionId) : undefined
  const steps = session ? flattenSessionSteps(session) : []

  const [stepIndex, setStepIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const currentStep = steps[stepIndex]
  const nextStep = steps[stepIndex + 1]

  const goToNextStep = () => {
    if (stepIndex + 1 >= steps.length) {
      setFinished(true)
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  if (!session) {
    return (
      <PlaceholderPage
        title="Séance introuvable"
        description="Cette séance n'existe plus dans ton programme."
      />
    )
  }

  if (finished || !currentStep) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <h1 className="text-lg font-semibold">Séance terminée</h1>
        <p className="text-sm text-text-muted">Bravo ! Dis-nous comment ça s'est passé.</p>
        <Button onClick={() => void navigate(`/session/${session.id}/feedback`)} className="w-full">
          Continuer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-4 px-4 py-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide text-text-muted">
            {DISCIPLINE_LABELS[session.discipline]} · {session.title}
          </p>
          <p className="text-xs tabular-nums text-text-muted">
            {stepIndex + 1} / {steps.length}
          </p>
        </div>
        <ProgressBar
          value={(stepIndex / steps.length) * 100}
          label={`Progression de la séance : étape ${stepIndex + 1} sur ${steps.length}`}
        />
      </div>

      <StepPlayer key={currentStep.key} step={currentStep} nextStep={nextStep} onComplete={goToNextStep} />
    </div>
  )
}
