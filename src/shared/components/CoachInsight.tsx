import type { AdaptationType } from '@/engine/adaptation/AdaptationDecision'
import { ADAPTATION_TYPE_LABELS } from '@/engine/adaptation/adaptationLabels'
import type { SessionExplanation } from '@/engine/coach/explainSession'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'

interface CoachInsightProps {
  /** Real engine-grounded "why this session" (brief §9/§10) when the
   * session carries a resolvable Workout Family — `family.explanation` is
   * already athlete-facing copy, and `placementNote` (from the composer's
   * own `reasonCodes`) adds why this specific occurrence was placed this
   * week, when the composer recorded a reason. */
  explanation?: SessionExplanation
  /** Shown instead of/alongside `explanation` when no family is resolvable
   * (older persisted sessions, a rest day, or a sport module — e.g.
   * running — that doesn't populate a Workout Family yet): never leaves
   * the athlete with a blank card. */
  fallbackMessage: string
  adaptation?: { type: AdaptationType; explanation: string }
}

/** One coherent "coach voice" for the day: the plan-driven explanation of
 * today's session, plus — when a check-in or availability adjustment just
 * changed something — the adaptation folded into the same card instead of
 * a separate disconnected banner (brief M1.1: coach insight). */
export function CoachInsight({ explanation, fallbackMessage, adaptation }: CoachInsightProps) {
  return (
    <Card variant="muted" className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">Ton coach</p>
      {explanation ? (
        <>
          <p className="text-sm text-text-muted">{explanation.headline}</p>
          {explanation.placementNote && <p className="text-sm text-text-muted">{explanation.placementNote}</p>}
          {/* Progressive disclosure (brief §36): the physiological detail is
           * real detail, not filler — but it belongs one tap deeper than
           * the headline, not competing with it for the athlete's first
           * five seconds on the screen. */}
          <details className="text-sm text-text-muted">
            <summary className="cursor-pointer select-none text-xs font-medium text-primary">
              Pourquoi cette séance ?
            </summary>
            <p className="mt-1">{explanation.trainingPurpose}</p>
            <p className="mt-1 text-xs">{explanation.physiologicalIntent}</p>
          </details>
        </>
      ) : (
        <p className="text-sm text-text-muted">{fallbackMessage}</p>
      )}
      {adaptation && (
        <div className="mt-1 flex items-start gap-2 rounded-[var(--radius-sm)] bg-accent/10 px-3 py-2">
          {/* neutral, not "accent": stacking two translucent accent layers
           * (this box + an accent-toned badge) lightens the composited
           * background enough to fail contrast — see docs/design-system.md */}
          <Badge tone="neutral">{ADAPTATION_TYPE_LABELS[adaptation.type]}</Badge>
          <p role="status" className="text-sm text-accent">
            {adaptation.explanation}
          </p>
        </div>
      )}
    </Card>
  )
}
