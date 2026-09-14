import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingWeek } from '@/core/training/TrainingPlan'
import { SwapSessionControl } from './SwapSessionControl'

function fullAvailability(): Availability {
  const pattern = createEmptyWeeklyPattern()
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const) {
    pattern[day] = { available: true, minutes: 60, poolAccess: true }
  }
  return { weeklyPattern: pattern, exceptions: [], restDays: ['sunday'] }
}

const SESSION: PlannedSession = {
  id: 'session-1',
  discipline: 'run',
  sessionType: 'endurance',
  title: 'Footing facile',
  objective: 'Base aérobie',
  blocks: [],
  estimatedDurationMin: 40,
  plannedDurationMin: 40,
  plannedBlocks: [],
  priority: 'secondary',
  date: '2026-06-01',
  weekId: 'week-1',
}

const WEEK: TrainingWeek = {
  id: 'week-1',
  weekNumber: 1,
  startDate: '2026-06-01',
  phase: 'base',
  targetLoad: 40,
  sessions: [SESSION],
}

describe('SwapSessionControl', () => {
  it('offers a discipline choice by default (triathlon)', async () => {
    const user = userEvent.setup()
    render(
      <SwapSessionControl
        session={SESSION}
        week={WEEK}
        phase="base"
        availability={fullAvailability()}
        onSwapped={vi.fn()}
        onConvertedToRest={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Changer de séance' }))
    expect(screen.getByRole('radio', { name: 'Repos' })).toBeInTheDocument()
    // At least one real discipline is offered alongside Repos.
    expect(screen.getAllByRole('radio').length).toBeGreaterThan(1)
  })

  it('offers only a Repos confirmation when discipline swap is disabled (running)', async () => {
    const user = userEvent.setup()
    const onConvertedToRest = vi.fn()
    render(
      <SwapSessionControl
        session={SESSION}
        week={WEEK}
        phase="base"
        availability={fullAvailability()}
        onSwapped={vi.fn()}
        onConvertedToRest={onConvertedToRest}
        allowDisciplineSwap={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'Convertir en repos' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Convertir en repos' }))

    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmer' }))
    expect(onConvertedToRest).toHaveBeenCalledOnce()
  })
})
