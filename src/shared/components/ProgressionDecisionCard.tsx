import type { ProgressionResponse } from '@/core/coaching/progressionState'
import {
  describeProgressionChange,
  PROGRESSION_DECISION_LABELS,
  PROGRESSION_DECISION_TONE,
} from '@/engine/progression/progressionLabels'
import { Badge } from './Badge'
import { Card } from './Card'

interface ProgressionDecisionCardProps {
  response: ProgressionResponse
  /** The family's level before this decision — needed to show a "X → Y" line. */
  previousLevel: number
  /** The family's ladder length (`WorkoutFamily.progressionLevels`), when known. */
  maxLevel?: number
  className?: string
}

/** One progression decision, explained (brief §13/§20): what the coach
 * concluded from the last exposure to this workout family, and what it
 * means for the next one — mirrors `AdaptationDecisionCard`'s "badge +
 * before/after + plain-language why" shape for the analogous
 * `AdaptationDecision`. */
export function ProgressionDecisionCard({
  response,
  previousLevel,
  maxLevel,
  className = '',
}: ProgressionDecisionCardProps) {
  const change = describeProgressionChange(previousLevel, response, maxLevel)

  return (
    <Card variant="muted" className={`flex flex-col gap-1.5 text-left ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={PROGRESSION_DECISION_TONE[response.decision]}>
          {PROGRESSION_DECISION_LABELS[response.decision]}
        </Badge>
        {change && <span className="text-xs font-medium tabular-nums text-text-muted">{change}</span>}
      </div>
      <p className="text-sm text-text-muted">{response.explanation}</p>
    </Card>
  )
}
