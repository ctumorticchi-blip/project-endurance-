import type { HTMLAttributes } from 'react'

type ProgressBarTone = 'primary' | 'accent'

interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'aria-label'> {
  /** 0-100. Values outside that range are clamped. */
  value: number
  /** Accessible name — there is no visible text label on the bar itself. */
  label: string
  tone?: ProgressBarTone
}

const TONE_CLASSES: Record<ProgressBarTone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
}

/** Thin determinate progress track, used wherever the app shows "how far
 * through" something the athlete already is (a session's steps, a step's
 * countdown) — brief M1.2: session player progress. */
export function ProgressBar({ value, label, tone = 'primary', className = '', ...props }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-1.5 overflow-hidden rounded-full bg-surface-muted ${className}`}
      {...props}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${TONE_CLASSES[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
