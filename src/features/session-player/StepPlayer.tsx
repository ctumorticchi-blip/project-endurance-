import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { ProgressBar } from '@/shared/components/ProgressBar'
import { useCountdown } from '@/shared/hooks/useCountdown'
import type { PlayerStep } from './flattenSessionSteps'
import { formatMinSec } from './formatTime'

interface StepPlayerProps {
  step: PlayerStep
  nextStep?: PlayerStep
  onComplete: () => void
}

/** Owns one step's countdown state. The parent renders this with
 * `key={step.key}` so moving to a new step remounts (and thus resets) it
 * cleanly instead of reconciling timer state in place. */
export function StepPlayer({ step, nextStep, onComplete }: StepPlayerProps) {
  const countdown = useCountdown(step.durationSec, onComplete)
  const isRest = step.kind === 'rest'
  const elapsedFraction = step.durationSec > 0 ? 1 - countdown.remaining / step.durationSec : 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={isRest ? 'accent' : 'primary'}>{isRest ? 'Récupération' : 'Travail'}</Badge>
          {!countdown.running && <Badge tone="warning">En pause</Badge>}
        </div>

        <p className="text-center text-base font-semibold">
          {step.label}
          {step.totalReps > 1 ? ` · ${step.repIndex}/${step.totalReps}` : ''}
        </p>

        <p className="text-6xl font-bold tabular-nums">{formatMinSec(countdown.remaining)}</p>

        <ProgressBar
          value={elapsedFraction * 100}
          tone={isRest ? 'accent' : 'primary'}
          label="Progression de l'étape en cours"
          className="w-full max-w-xs"
        />

        <p className="text-sm text-text-muted">
          {step.targetZone ? `${step.targetZone} · ` : ''}
          RPE {step.targetRpeMin}-{step.targetRpeMax}
        </p>

        {step.note && <p className="max-w-xs text-center text-xs text-text-muted">{step.note}</p>}

        <p className="text-xs text-text-faint">{nextStep ? `Suivant : ${nextStep.label}` : 'Dernière étape'}</p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={countdown.running ? countdown.pause : countdown.resume}
          className="flex-1"
        >
          {countdown.running ? 'Pause' : 'Reprendre'}
        </Button>
        <Button variant="secondary" onClick={onComplete} className="flex-1">
          Passer
        </Button>
      </div>
    </div>
  )
}
