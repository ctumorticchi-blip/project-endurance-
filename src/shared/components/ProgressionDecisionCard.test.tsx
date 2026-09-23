import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ProgressionResponse } from '@/core/coaching/progressionState'
import { PROGRESSION_DECISION_LABELS } from '@/engine/progression/progressionLabels'
import { ProgressionDecisionCard } from './ProgressionDecisionCard'

function response(overrides: Partial<ProgressionResponse> = {}): ProgressionResponse {
  return {
    decision: 'PROGRESS',
    reasonCodes: ['ATHLETE_READY_TO_PROGRESS'],
    explanation: 'La dernière séance a semblé plus facile que prévu.',
    nextLevel: 3,
    ...overrides,
  }
}

describe('ProgressionDecisionCard', () => {
  it('renders the label matching the decision, and only that one (brief §58 contract)', () => {
    render(<ProgressionDecisionCard response={response({ decision: 'PROGRESS' })} previousLevel={2} maxLevel={5} />)
    expect(screen.getByText(PROGRESSION_DECISION_LABELS.PROGRESS)).toBeInTheDocument()
    expect(screen.queryByText(PROGRESSION_DECISION_LABELS.MAINTAIN)).not.toBeInTheDocument()
    expect(screen.queryByText(PROGRESSION_DECISION_LABELS.REGRESS)).not.toBeInTheDocument()
  })

  it('shows the level change line when the level actually changes', () => {
    render(<ProgressionDecisionCard response={response({ nextLevel: 3 })} previousLevel={2} maxLevel={5} />)
    expect(screen.getByText('Niveau 2/5 → 3/5')).toBeInTheDocument()
  })

  it('never shows a level change line for a MAINTAIN decision that kept the same level', () => {
    render(
      <ProgressionDecisionCard
        response={response({ decision: 'MAINTAIN', nextLevel: 2 })}
        previousLevel={2}
        maxLevel={5}
      />,
    )
    expect(screen.queryByText(/Niveau/)).not.toBeInTheDocument()
  })

  it('always renders the engine explanation text verbatim', () => {
    render(<ProgressionDecisionCard response={response()} previousLevel={2} maxLevel={5} />)
    expect(screen.getByText(response().explanation)).toBeInTheDocument()
  })
})
