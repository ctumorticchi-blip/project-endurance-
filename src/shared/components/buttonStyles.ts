export type ButtonVariant = 'primary' | 'secondary' | 'danger'

const BASE_BUTTON_CLASSES =
  'rounded-[var(--radius-sm)] px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-40'
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // The glow is a pure box-shadow (outside the button, never behind the
  // label), so it never touches the verified label/background contrast.
  primary: 'bg-primary text-background shadow-[0_6px_20px_-4px_rgb(255_107_74_/_55%)]',
  secondary: 'border border-border bg-transparent text-text',
  danger: 'bg-danger text-background',
}

export function buttonClassName(variant: ButtonVariant = 'primary', className = ''): string {
  return `${BASE_BUTTON_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`
}
