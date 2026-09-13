import { Button } from '@/shared/components/Button'
import { useCountdown } from '@/shared/hooks/useCountdown'
import type { PlayerStep } from './flattenSessionSteps'
import { formatMinSec } from './formatTime'

interface StepPlayerProps {
  step: PlayerStep
  onComplete: () => void
}

/** Owns one step's countdown state. The parent renders this with
 * `key={step.key}` so moving to a new step remounts (and thus resets) it
 * cleanly instead of reconciling timer state in place. */
export function StepPlayer({ step, onComplete }: StepPlayerProps) {
  const countdown = useCountdown(step.durationSec, onComplete)

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className={`text-sm font-medium ${step.kind === 'rest' ? 'text-accent' : 'text-primary'}`}>
          {step.label}
          {step.totalReps > 1 ? ` (${step.repIndex}/${step.totalReps})` : ''}
        </p>

        <p className="text-6xl font-bold tabular-nums">{formatMinSec(countdown.remaining)}</p>

        <p className="text-sm text-text-muted">
          {step.targetZone ? `${step.targetZone} · ` : ''}
          RPE {step.targetRpeMin}-{step.targetRpeMax}
        </p>

        {step.note && <p className="max-w-xs text-center text-xs text-text-muted">{step.note}</p>}
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
