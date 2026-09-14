import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import { allSessions } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { OnboardingPage } from './OnboardingPage'

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/today" element={<div>TODAY SCREEN</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OnboardingPage', () => {
  it('shows a welcome screen before the first step', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    expect(screen.getByText('Construisons ton programme')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continuer' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(screen.getByText('Ton objectif')).toBeInTheDocument()
  })

  it('walks a full happy path and persists the three domain aggregates', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: 'Commencer' }))

    // Step 1: race goal
    await user.click(screen.getByLabelText(/Sprint/))
    fireEvent.change(screen.getByLabelText('Date de la course'), {
      target: { value: '2026-12-01' },
    })
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 2: experience — "Intermédiaire" is offered by 4 separate radio
    // groups (general experience + swim/bike/run levels); select all of them.
    const intermediateRadios = screen.getAllByRole('radio', { name: 'Intermédiaire' })
    expect(intermediateRadios).toHaveLength(4)
    for (const radio of intermediateRadios) await user.click(radio)
    await user.click(screen.getByRole('radio', { name: /déjà fait quelques courses/ }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 3: equipment (no required fields)
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 4: metrics (optional)
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 5: availability — need at least one rest day and one available day
    await user.click(screen.getByRole('checkbox', { name: 'Repos le Dimanche' }))
    const saturdayCheckbox = screen.getByRole('checkbox', { name: /^Samedi$/ })
    await user.click(saturdayCheckbox)
    const minutesInput = screen.getByLabelText('Minutes disponibles le Samedi')
    await user.clear(minutesInput)
    await user.type(minutesInput, '90')
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 6: review + submit
    expect(screen.getByText('Vérifie ton profil')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Créer mon programme' }))

    expect(await screen.findByText('TODAY SCREEN')).toBeInTheDocument()

    const profile = AthleteProfileRepository.load()
    const goal = RaceGoalRepository.load()
    const availability = AvailabilityRepository.load()

    expect(profile?.disciplineLevels).toEqual({
      swim: 'intermediate',
      bike: 'intermediate',
      run: 'intermediate',
    })
    expect(goal).toEqual(expect.objectContaining({ distance: 'sprint', raceDate: '2026-12-01' }))
    expect(availability?.weeklyPattern.saturday).toEqual({
      available: true,
      minutes: 90,
      poolAccess: false,
    })

    const plan = TrainingPlanRepository.load()
    expect(plan).toBeDefined()
    expect(plan?.raceGoalId).toBe(goal?.id)
    expect(plan?.weeks.length).toBeGreaterThan(0)
    // Only Saturday is available, so every session must land on a Saturday.
    for (const session of allSessions(plan!)) {
      expect(new Date(session.date).getDay()).toBe(6)
    }
  })

  it('walks a full happy path for a running race goal and generates a running-only plan', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: 'Commencer' }))

    // Step 1: race goal — switch sport to running, then pick a running distance.
    await user.click(screen.getByRole('radio', { name: 'Course à pied' }))
    await user.click(screen.getByLabelText(/^10 km/))
    fireEvent.change(screen.getByLabelText('Date de la course'), {
      target: { value: '2026-12-01' },
    })
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 2: experience — running only asks general experience + run level
    // (2 "Intermédiaire" radios, not 4) plus a running-specific experience question.
    const intermediateRadios = screen.getAllByRole('radio', { name: 'Intermédiaire' })
    expect(intermediateRadios).toHaveLength(2)
    for (const radio of intermediateRadios) await user.click(radio)
    await user.click(screen.getByRole('radio', { name: /déjà couru quelques courses/ }))
    expect(screen.queryByRole('radio', { name: /triathlète/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 3: equipment — running shows an informational message, no fields.
    expect(screen.getByText(/ne demande pas de matériel spécifique/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 4: metrics (optional) — no FTP/CSS fields for running.
    expect(screen.queryByText('FTP vélo (watts)')).not.toBeInTheDocument()
    expect(screen.queryByText('CSS natation')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 5: availability — no pool-access checkbox for a running plan.
    await user.click(screen.getByRole('checkbox', { name: 'Repos le Dimanche' }))
    const saturdayCheckbox = screen.getByRole('checkbox', { name: /^Samedi$/ })
    await user.click(saturdayCheckbox)
    const minutesInput = screen.getByLabelText('Minutes disponibles le Samedi')
    await user.clear(minutesInput)
    await user.type(minutesInput, '90')
    expect(screen.queryByText('Piscine accessible ce jour-là')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    // Step 6: review + submit
    expect(screen.getByText(/Course à pied · 10 km/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Créer mon programme' }))

    expect(await screen.findByText('TODAY SCREEN')).toBeInTheDocument()

    const profile = AthleteProfileRepository.load()
    const goal = RaceGoalRepository.load()

    expect(profile?.sport).toBe('running')
    expect(profile?.disciplineLevels).toEqual({ run: 'intermediate' })
    expect(goal).toEqual(
      expect.objectContaining({ sport: 'running', distance: '10k', raceDate: '2026-12-01' }),
    )

    const plan = TrainingPlanRepository.load()
    expect(plan).toBeDefined()
    expect(plan?.raceGoalId).toBe(goal?.id)
    const disciplines = new Set(allSessions(plan!).map((s) => s.discipline))
    expect(disciplines.has('swim')).toBe(false)
    expect(disciplines.has('bike')).toBe(false)
  })

  it('keeps Continue disabled until the current step is valid', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled()
  })
})
