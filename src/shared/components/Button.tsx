import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-40'
  const variants = {
    primary: 'bg-primary text-background',
    secondary: 'border border-border bg-transparent text-text',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
