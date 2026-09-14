export type ButtonVariant = 'primary' | 'secondary' | 'danger'

const BASE_BUTTON_CLASSES =
  'rounded-[var(--radius-sm)] px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-40'
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-background',
  secondary: 'border border-border bg-transparent text-text',
  danger: 'bg-danger text-background',
}

export function buttonClassName(variant: ButtonVariant = 'primary', className = ''): string {
  return `${BASE_BUTTON_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`
}
