import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createEmptyWeeklyPattern } from '@/core/availability/Availability'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { SessionFeedbackRepository } from '@/core/history/SessionFeedbackRepository'
import { createPlannedSession, type SessionPriority } from '@/core/training/PlannedSession'
import { createTrainingPlan } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { MissedSessionPage } from './MissedSessionPage'

function seedPlanWithOneSession(priority: SessionPriority = 'key') {
  const session = createPlannedSession({
    discipline: 'run',
    sessionType: 'threshold',
    title: 'Seuil course',
    objective: 'Objectif',
    blocks: [],
    estimatedDurationMin: 50,
    priority,
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

    // A missed key session with no known availability can't be MOVEd, so
    // the engine REPLACEs it with a shortened version — surfaced before
    // returning to Today, not a silent redirect.
    expect(await screen.findByText('Programme mis à jour')).toBeInTheDocument()

    // Training Intelligence V2: a missed exposure is also recorded against
    // the session's workout family (run/threshold → RUN_THRESHOLD), and the
    // resulting progression explanation is shown alongside the adaptation
    // outcome rather than discarded.
    expect(screen.getByText('Pour la prochaine fois')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "Retour à Aujourd'hui" }))
    expect(await screen.findByText('TODAY')).toBeInTheDocument()

    const feedback = SessionFeedbackRepository.loadAll()
    expect(feedback).toHaveLength(1)
    expect(feedback[0]).toMatchObject({
      plannedSessionId: session.id,
      outcome: 'missed',
      missedReason: 'fatigue',
    })

    const updatedPlan = TrainingPlanRepository.load()
    const updatedSession = updatedPlan?.weeks[0]?.sessions[0]
    expect(updatedSession?.estimatedDurationMin).toBeLessThan(session.estimatedDurationMin)
  })

  it('REMOVEs a missed optional session from the plan instead of rescheduling it', async () => {
    const session = seedPlanWithOneSession('optional')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={[`/session/${session.id}/missed`]}>
        <Routes>
          <Route path="/session/:sessionId/missed" element={<MissedSessionPage />} />
          <Route path="/today" element={<div>TODAY</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('radio', { name: 'Manque de temps' }))
    await user.click(screen.getByRole('button', { name: 'Confirmer' }))
    await user.click(await screen.findByRole('button', { name: "Retour à Aujourd'hui" }))
    await screen.findByText('TODAY')

    const updatedPlan = TrainingPlanRepository.load()
    expect(updatedPlan?.weeks[0]?.sessions).toHaveLength(0)
  })

  it('MOVEs a missed key session to the earliest slot with enough free time', async () => {
    const session = seedPlanWithOneSession('key')
    const pattern = createEmptyWeeklyPattern()
    // 2026-06-01 is a Monday; give Wednesday (06-03) enough free time.
    pattern.wednesday = { available: true, minutes: 90, poolAccess: false }
    AvailabilityRepository.save({ weeklyPattern: pattern, exceptions: [] })

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[`/session/${session.id}/missed`]}>
        <Routes>
          <Route path="/session/:sessionId/missed" element={<MissedSessionPage />} />
          <Route path="/today" element={<div>TODAY</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('radio', { name: 'Manque de temps' }))
    await user.click(screen.getByRole('button', { name: 'Confirmer' }))
    expect(await screen.findByText(/déplacée au 2026-06-03/)).toBeInTheDocument()

    const updatedPlan = TrainingPlanRepository.load()
    expect(updatedPlan?.weeks[0]?.sessions[0]?.date).toBe('2026-06-03')
  })
})
