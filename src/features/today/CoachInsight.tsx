import type { AdaptationType } from '@/engine/adaptation/AdaptationDecision'
import { ADAPTATION_TYPE_LABELS } from '@/engine/adaptation/adaptationLabels'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'

interface CoachInsightProps {
  message: string
  adaptation?: { type: AdaptationType; explanation: string }
}

/** One coherent "coach voice" for the day: the plan-driven explanation of
 * today's session, plus — when a check-in or availability adjustment just
 * changed something — the adaptation folded into the same card instead of
 * a separate disconnected banner (brief M1.1: coach insight). */
export function CoachInsight({ message, adaptation }: CoachInsightProps) {
  return (
    <Card variant="muted" className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">Ton coach</p>
      <p className="text-sm text-text-muted">{message}</p>
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
