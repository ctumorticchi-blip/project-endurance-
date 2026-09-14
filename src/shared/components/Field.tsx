import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

/** Consistent label/control/hint stacking for every form field in the
 * app — the actual `<input>`/`<textarea>`/`<select>` is passed as a
 * child so each field keeps full control of its own type and behavior. */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </label>
  )
}
