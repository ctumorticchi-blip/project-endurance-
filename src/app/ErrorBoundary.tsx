import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | undefined
}

/**
 * Last-resort safety net: an uncaught render error anywhere in the app
 * used to mean a blank white screen with no way back. Catches it, shows a
 * plain-language apology instead, and offers a way home — never a raw
 * stack trace to someone who just wants to see today's session.
 *
 * No monitoring service is wired up yet (see docs/roadmap.md) —
 * `console.error` is what keeps a crash from failing completely
 * silently in production until one is.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: undefined }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)
  }

  handleGoHome = () => {
    window.location.assign('/today')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 bg-background px-6 py-10 text-center text-text">
        <p aria-hidden="true" className="text-4xl">
          😕
        </p>
        <div>
          <h1 className="text-lg font-semibold">Une erreur inattendue s'est produite</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ce n'est pas grave : tes données restent sur cet appareil. Essaie de revenir à
            l'accueil.
          </p>
        </div>
        <Card variant="muted" className="w-full text-left text-xs text-text-faint">
          {error.message}
        </Card>
        <Button onClick={this.handleGoHome} className="w-full">
          Retour à l'accueil
        </Button>
      </div>
    )
  }
}
