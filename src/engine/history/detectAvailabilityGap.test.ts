import { describe, expect, it } from 'vitest'
import { createEmptyWeeklyPattern, type Availability } from '@/core/availability/Availability'
import { createSessionFeedback, type SessionFeedback, type SessionOutcome } from '@/core/history/SessionFeedback'
import { detectAvailabilityGap } from './detectAvailabilityGap'

function availabilityWithDays(count: number): Availability {
  const pattern = createEmptyWeeklyPattern()
  const days = Object.keys(pattern) as (keyof typeof pattern)[]
  for (let i = 0; i < count; i++) {
    pattern[days[i]!] = { available: true, minutes: 60, poolAccess: false }
  }
  return { weeklyPattern: pattern, exceptions: [] }
}

function feedback(outcomes: SessionOutcome[]): SessionFeedback[] {
  return outcomes.map((outcome) =>
    createSessionFeedback({ plannedSessionId: 'x', outcome, rpe: outcome === 'missed' ? undefined : 5 }),
  )
}

describe('detectAvailabilityGap', () => {
  it('reports no gap when there is not enough history yet', () => {
    const result = detectAvailabilityGap(availabilityWithDays(6), feedback(['missed', 'missed', 'missed']))
    expect(result.hasGap).toBe(false)
  })

  it('reports no gap when completion rate is healthy', () => {
    const outcomes: SessionOutcome[] = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'partial', 'missed']
    const result = detectAvailabilityGap(availabilityWithDays(6), feedback(outcomes))
    expect(result.hasGap).toBe(false)
  })

  it('flags a persistent gap and suggests a lower weekly frequency', () => {
    const outcomes: SessionOutcome[] = ['missed', 'missed', 'missed', 'missed', 'missed', 'completed', 'completed', 'missed']
    const result = detectAvailabilityGap(availabilityWithDays(6), feedback(outcomes))
    expect(result.hasGap).toBe(true)
    expect(result.suggestedSessionsPerWeek).toBeLessThan(result.declaredSessionsPerWeek)
    expect(result.suggestion).toBeTruthy()
  })

  it('never suggests fewer than 1 session per week', () => {
    const outcomes: SessionOutcome[] = new Array(8).fill('missed') as SessionOutcome[]
    const result = detectAvailabilityGap(availabilityWithDays(6), feedback(outcomes))
    expect(result.suggestedSessionsPerWeek).toBeGreaterThanOrEqual(1)
  })
})
