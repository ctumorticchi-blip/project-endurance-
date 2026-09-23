import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CompletedSessionRepository } from '@/core/history/CompletedSessionRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { createTrainingPlan } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { CompletedFeedbackPage } from './CompletedFeedbackPage'

function seedPlanWithOneSession() {
  const session = createPlannedSession({
    discipline: 'bike',
    sessionType: 'endurance',
    title: 'Endurance vélo',
    objective: 'Objectif',
    blocks: [],
    estimatedDurationMin: 60,
    priority: 'secondary',
    date: '2026-06-01',
    weekId: 'week-1',
  })
  const plan = createTrainingPlan({
    raceGoalId: 'goal-1',
    warnings: [],
    weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-01', phase: 'base', targetLoad: 42, sessions: [session] }],
  })
  TrainingPlanRepository.save(plan)
  return session
}

describe('CompletedFeedbackPage', () => {
  it('requires RPE and difficulty before allowing submission, then persists both records', async () => {
    const session = seedPlanWithOneSession()
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={[`/session/${session.id}/feedback`]}>
        <Routes>
          <Route path="/session/:sessionId/feedback" element={<CompletedFeedbackPage />} />
          <Route path="/today" element={<div>TODAY</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const submit = screen.getByRole('button', { name: 'Enregistrer' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '7' }))
    await user.click(screen.getByRole('radio', { name: 'Comme prévu' }))
    expect(submit).toBeEnabled()

    await user.click(submit)

    // Training Intelligence V2: submitting feedback for a session that maps
    // to a workout family (bike/endurance does) shows a brief progression
    // confirmation before returning to Today, rather than navigating away
    // immediately — see CompletedFeedbackPage's `progressionResponse` state.
    const continueButton = await screen.findByRole('button', { name: 'Continuer' })
    expect(screen.getByText('Pour la prochaine fois')).toBeInTheDocument()
    await user.click(continueButton)
    expect(await screen.findByText('TODAY')).toBeInTheDocument()

    const completed = CompletedSessionRepository.loadAll()
    const feedback = SessionFeedbackRepository.loadAll()
    expect(completed).toHaveLength(1)
    expect(completed[0]?.plannedSessionId).toBe(session.id)
    expect(feedback[0]).toMatchObject({
      outcome: 'completed',
      rpe: 7,
      perceivedDifficulty: 'as-expected',
    })
  })
})
