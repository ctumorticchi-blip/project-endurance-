import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/Button'
import { ONBOARDING_STEPS, createInitialDraft, type OnboardingDraft } from './onboardingState'
import { isStepValid } from './stepValidation'
import { submitOnboarding } from './submitOnboarding'
import { RaceGoalStep } from './steps/RaceGoalStep'
import { ExperienceStep } from './steps/ExperienceStep'
import { EquipmentStep } from './steps/EquipmentStep'
import { MetricsStep } from './steps/MetricsStep'
import { AvailabilityStep } from './steps/AvailabilityStep'
import { ReviewStep } from './steps/ReviewStep'

const STEP_TITLES: Record<(typeof ONBOARDING_STEPS)[number], string> = {
  'race-goal': 'Objectif',
  experience: 'Expérience',
  equipment: 'Matériel',
  metrics: 'Données',
  availability: 'Disponibilités',
  review: 'Résumé',
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<OnboardingDraft>(createInitialDraft)

  const step = ONBOARDING_STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1
  const canContinue = step !== undefined && isStepValid(step, draft)

  const patchDraft = (patch: Partial<OnboardingDraft>) => setDraft((prev) => ({ ...prev, ...patch }))

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1))
  const goNext = () => setStepIndex((i) => Math.min(ONBOARDING_STEPS.length - 1, i + 1))

  const handleSubmit = () => {
    submitOnboarding(draft)
    void navigate('/today', { replace: true })
  }

  return (
    <div className="flex min-h-full flex-col">
      <div
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS.length}
        aria-label={`Étape ${stepIndex + 1} sur ${ONBOARDING_STEPS.length} : ${step ? STEP_TITLES[step] : ''}`}
        className="flex gap-1 px-4 pt-4"
      >
        {ONBOARDING_STEPS.map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-surface-muted'}`}
          />
        ))}
      </div>

      <div className="flex-1">
        {step === 'race-goal' && <RaceGoalStep draft={draft} onChange={patchDraft} />}
        {step === 'experience' && <ExperienceStep draft={draft} onChange={patchDraft} />}
        {step === 'equipment' && <EquipmentStep draft={draft} onChange={patchDraft} />}
        {step === 'metrics' && <MetricsStep draft={draft} onChange={patchDraft} />}
        {step === 'availability' && <AvailabilityStep draft={draft} onChange={patchDraft} />}
        {step === 'review' && <ReviewStep draft={draft} />}
      </div>

      <div className="flex gap-3 border-t border-border px-4 py-4">
        {!isFirst && (
          <Button variant="secondary" onClick={goBack} className="flex-1">
            Retour
          </Button>
        )}
        {!isLast && (
          <Button onClick={goNext} disabled={!canContinue} className="flex-1">
            Continuer
          </Button>
        )}
        {isLast && (
          <Button onClick={handleSubmit} disabled={!canContinue} className="flex-1">
            Créer mon programme
          </Button>
        )}
      </div>
    </div>
  )
}
