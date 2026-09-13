import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { createTrainingPlan } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { MissedSessionPage } from './MissedSessionPage'

function seedPlanWithOneSession() {
  const session = createPlannedSession({
    discipline: 'run',
    sessionType: 'threshold',
    title: 'Seuil course',
    objective: 'Objectif',
    blocks: [],
    estimatedDurationMin: 50,
    priority: 'key',
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

describe('MissedSessionPage', () => {
  it('requires a reason before confirming, then records a missed feedback entry', async () => {
    const session = seedPlanWithOneSession()
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={[`/session/${session.id}/missed`]}>
        <Routes>
          <Route path="/session/:sessionId/missed" element={<MissedSessionPage />} />
          <Route path="/today" element={<div>TODAY</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const confirm = screen.getByRole('button', { name: 'Confirmer' })
    expect(confirm).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Fatigue' }))
    expect(confirm).toBeEnabled()
    await user.click(confirm)

    expect(await screen.findByText('TODAY')).toBeInTheDocument()

    const feedback = SessionFeedbackRepository.loadAll()
    expect(feedback).toHaveLength(1)
    expect(feedback[0]).toMatchObject({
      plannedSessionId: session.id,
      outcome: 'missed',
      missedReason: 'fatigue',
    })
  })
})
