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

  it('keeps Continue disabled until the current step is valid', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled()
  })
})
