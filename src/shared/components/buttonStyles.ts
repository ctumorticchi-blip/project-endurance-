export type ButtonVariant = 'primary' | 'secondary'

const BASE_BUTTON_CLASSES = 'rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-40'
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-background',
  secondary: 'border border-border bg-transparent text-text',
}

export function buttonClassName(variant: ButtonVariant = 'primary', className = ''): string {
  return `${BASE_BUTTON_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`
}
