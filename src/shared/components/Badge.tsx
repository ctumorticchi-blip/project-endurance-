import type { HTMLAttributes } from 'react'

type BadgeTone = 'neutral' | 'primary' | 'accent' | 'warning' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

// Every tinted tone blends its color at 15% over the (very dark) page
// background rather than using a solid "muted" swatch — a solid mid-tone
// like the old bg-primary-muted reads as light enough to fail WCAG AA
// contrast against the same-hue text (measured 4.42:1, needs 4.5:1).
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-muted',
  primary: 'bg-primary/15 text-primary',
  accent: 'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
}

/** Small inline label — priority, phase, discipline, zone — never
 * conveys meaning through color alone (text is always present). */
export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  )
}
