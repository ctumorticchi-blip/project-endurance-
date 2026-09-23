import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createPlannedSession, type PlannedSession } from '@/core/training/PlannedSession'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import { SessionBlockList } from './SessionBlockList'

function block(overrides: Partial<WorkoutBlock>): WorkoutBlock {
  return { id: crypto.randomUUID(), label: 'Bloc', targetRpeMin: 3, targetRpeMax: 5, ...overrides }
}

function session(discipline: PlannedSession['discipline'], blocks: WorkoutBlock[]): PlannedSession {
  return createPlannedSession({
    discipline,
    sessionType: 'endurance',
    title: 'Séance',
    objective: 'Objectif',
    estimatedDurationMin: 60,
    priority: 'key',
    date: '2026-01-05',
    weekId: 'week-1',
    blocks,
  })
}

describe('SessionBlockList', () => {
  it('renders a flat list with no section headers when the session has no warm-up/cool-down block', () => {
    render(
      <SessionBlockList
        session={session('swim', [block({ label: '10x100m CSS' })])}
        zones={{}}
      />,
    )
    expect(screen.queryByText('Échauffement')).not.toBeInTheDocument()
    expect(screen.queryByText('Bloc principal')).not.toBeInTheDocument()
  })

  it('groups into warm-up / main / cool-down sections once the session actually has them', () => {
    render(
      <SessionBlockList
        session={session('run', [
          block({ label: 'Échauffement', durationSec: 600 }),
          block({ label: '4x8min seuil' }),
          block({ label: 'Retour au calme', durationSec: 600 }),
        ])}
        zones={{}}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Échauffement' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bloc principal' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Retour au calme' })).toBeInTheDocument()
  })

  it('splits a brick session into its bike/transition/run parts rather than one flat block (brief §48)', () => {
    render(
      <SessionBlockList
        session={session('brick', [
          block({ label: 'Vélo allure course', durationSec: 3600 }),
          block({ label: 'Transition rapide', durationSec: 120 }),
          block({ label: 'Course allure course', durationSec: 1500 }),
        ])}
        zones={{}}
      />,
    )
    expect(screen.getByText('Partie 1 · Vélo')).toBeInTheDocument()
    expect(screen.getByText('Transition')).toBeInTheDocument()
    expect(screen.getByText('Partie 2 · Course')).toBeInTheDocument()
  })

  it('falls back to the raw zone name (never fabricates a number) when no metric is tested', () => {
    render(
      <SessionBlockList
        session={session('bike', [block({ label: 'Seuil', targetZone: 'Z4', durationSec: 480 })])}
        zones={{}}
      />,
    )
    expect(screen.getByText(/Z4/)).toBeInTheDocument()
  })

  it('shows the real resolved power target once FTP is known, instead of the raw zone name', () => {
    render(
      <SessionBlockList
        session={session('bike', [block({ label: 'Seuil', targetZone: 'Z4', durationSec: 480 })])}
        zones={{ power: [{ name: 'Z4', label: 'Seuil', min: 200, max: 220 }] }}
      />,
    )
    expect(screen.getByText(/200–220 W/)).toBeInTheDocument()
  })
})
