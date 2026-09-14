import type { HTMLAttributes } from 'react'

type BadgeTone = 'neutral' | 'primary' | 'accent' | 'warning' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

// Every tinted tone blends its color over its background rather than using
// a solid "muted" swatch — see docs/design-system.md for why the alpha is
// re-derived (not just re-verified) whenever a base color or a surface
// tone changes: a Badge renders on four different backgrounds depending on
// which Card it sits in, so the alpha must clear 4.5:1 against all four,
// not just the one it happened to be tuned against. 6% keeps every tone
// above 4.5:1 on all four surfaces of the current (Garmin-inspired) navy
// palette (worst case 4.61:1, on primary/surface-raised).
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-muted',
  primary: 'bg-primary/6 text-primary',
  accent: 'bg-accent/6 text-accent',
  warning: 'bg-warning/6 text-warning',
  danger: 'bg-danger/6 text-danger',
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
