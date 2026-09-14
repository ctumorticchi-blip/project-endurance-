import type { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'muted' | 'raised'

interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant
  /** Renders as this element instead of `div` — needed when the card sits
   * inside a `<ul>/<ol>` and must be a real `<li>` for valid HTML. */
  as?: 'div' | 'li'
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'border border-border bg-surface',
  muted: 'bg-surface-muted',
  raised: 'border border-border-strong bg-surface-raised shadow-[var(--shadow-raised)]',
}

/** The one card treatment used across the app — replaces the
 * `rounded-lg border border-border bg-surface p-4` pattern that used to
 * be copy-pasted into every feature (brief M1.0: consistent cards). */
export function Card({ variant = 'default', as: Tag = 'div', className = '', ...props }: CardProps) {
  return (
    <Tag
      className={`rounded-[var(--radius-md)] p-4 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
