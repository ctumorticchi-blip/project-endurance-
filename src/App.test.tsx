import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AthleteProfileRepository } from '@/core/athlete/AthleteProfileRepository'
import { createAthleteProfile } from '@/core/athlete/AthleteProfile'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { createEmptyWeeklyPattern } from '@/core/availability/Availability'
import { createRaceGoal } from '@/core/goals/RaceGoal'
import { RaceGoalRepository } from '@/core/goals/RaceGoalRepository'
import App from './App'

function completeOnboardingInStorage() {
  AthleteProfileRepository.save(
    createAthleteProfile({
      generalSportExperience: 'intermediate',
      triathlonExperience: 'some-races',
      disciplineLevels: { swim: 'intermediate', bike: 'intermediate', run: 'intermediate' },
      equipment: { hasPoolAccess: true, hasBike: true, hasHomeTrainer: false },
      knownMetrics: {},
    }),
  )
  RaceGoalRepository.save(createRaceGoal({ distance: 'sprint', raceDate: '2026-12-01' }))
  const pattern = createEmptyWeeklyPattern()
  pattern.saturday = { available: true, minutes: 90, poolAccess: false }
  AvailabilityRepository.save({ weeklyPattern: pattern, exceptions: [] })
}

describe('App', () => {
  it('sends a fresh visitor into onboarding first', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByText('Ton objectif')).toBeInTheDocument()
  })

  it('redirects an onboarded athlete straight to Today with navigation visible', async () => {
    completeOnboardingInStorage()
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByText('Aujourd’hui', { selector: 'h1' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
  })
})
