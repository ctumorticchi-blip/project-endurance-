import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { brand } from '@/config/brand'
import { Button } from '@/shared/components/Button'
import { ONBOARDING_STEPS, createInitialDraft, type OnboardingDraft } from './onboardingState'
import { isStepValid } from './stepValidation'
import { submitOnboarding } from './submitOnboarding'
import { TriathlonBadgeIllustration } from './TriathlonBadgeIllustration'
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

const WELCOME_HIGHLIGHTS = [
  'Ton objectif de course, ton expérience et ton matériel',
  'Tes disponibilités réelles, pas un planning idéal',
  'Un programme qui s’explique et s’ajuste ensuite à ta vraie vie',
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [showWelcome, setShowWelcome] = useState(true)
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

  if (showWelcome) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-10 text-center">
        <TriathlonBadgeIllustration />

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">{brand.name}</p>
          <h1 className="text-2xl font-bold">Construisons ton programme</h1>
          <p className="text-sm text-text-muted">{brand.tagline}</p>
        </div>

        <ul className="flex flex-col gap-2 text-left text-sm text-text-muted">
          {WELCOME_HIGHLIGHTS.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-primary">
                ✓
              </span>
              {highlight}
            </li>
          ))}
        </ul>

        <div className="flex w-full flex-col gap-2">
          <Button onClick={() => setShowWelcome(false)} className="w-full">
            Commencer
          </Button>
          <p className="text-xs text-text-faint">Environ 3 minutes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-1.5 px-4 pt-4">
        <div
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={ONBOARDING_STEPS.length}
          aria-label={`Étape ${stepIndex + 1} sur ${ONBOARDING_STEPS.length} : ${step ? STEP_TITLES[step] : ''}`}
          className="flex gap-1"
        >
          {ONBOARDING_STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-surface-muted'}`}
            />
          ))}
        </div>
        <p aria-hidden="true" className="text-xs text-text-faint">
          Étape {stepIndex + 1}/{ONBOARDING_STEPS.length} · {step ? STEP_TITLES[step] : ''}
        </p>
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
