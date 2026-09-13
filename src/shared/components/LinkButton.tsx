import { Link, type LinkProps } from 'react-router-dom'
import { buttonClassName, type ButtonVariant } from './buttonStyles'

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant
}

/** Same visual treatment as `Button`, but renders a real `<a>` (via
 * react-router's `Link`) — never nest an interactive `<Link>` inside a
 * `<button>`, which is invalid HTML and breaks keyboard/AT navigation. */
export function LinkButton({ variant = 'primary', className = '', ...props }: LinkButtonProps) {
  return (
    <Link className={`inline-block text-center ${buttonClassName(variant, className)}`} {...props} />
  )
}
