import type { AdaptationDecision } from '@/engine/adaptation/AdaptationDecision'
import { ADAPTATION_TYPE_LABELS, ADAPTATION_TYPE_TONE, describeAdaptationChange } from '@/engine/adaptation/adaptationLabels'
import { Badge } from './Badge'
import { Card } from './Card'

interface AdaptationDecisionCardProps {
  decision: AdaptationDecision
  as?: 'div' | 'li'
  className?: string
}

/** One coach decision, explained: what changed (a type badge and, when
 * there's a concrete before/after, a short "X → Y" line) plus the plain-
 * language why. Used both as a single result screen (missed-session flow)
 * and as a list item (Progress history) — brief §28: the UI never shows a
 * bare mutation without its explanation. */
export function AdaptationDecisionCard({ decision, as = 'div', className = '' }: AdaptationDecisionCardProps) {
  const change = describeAdaptationChange(decision)

  return (
    <Card as={as} variant="muted" className={`flex flex-col gap-1.5 text-left ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={ADAPTATION_TYPE_TONE[decision.type]}>{ADAPTATION_TYPE_LABELS[decision.type]}</Badge>
        {change && <span className="text-xs font-medium tabular-nums text-text-muted">{change}</span>}
      </div>
      <p className="text-sm text-text-muted">{decision.explanation}</p>
    </Card>
  )
}
