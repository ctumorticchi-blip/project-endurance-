import { describe, expect, it } from 'vitest'
import { getRaceDistanceLabel, getRecommendedMinWeeksBeginner } from './raceGoalDisplay'
import type { RunningRaceGoal, TriathlonRaceGoal } from './RaceGoal'

const triathlonGoal: TriathlonRaceGoal = {
  sport: 'triathlon',
  distance: 'olympic',
  id: '1',
  raceDate: '2026-06-01',
  createdAt: '2026-01-01',
}

const runningGoal: RunningRaceGoal = {
  sport: 'running',
  distance: 'marathon',
  id: '2',
  raceDate: '2026-10-01',
  createdAt: '2026-01-01',
}

describe('getRaceDistanceLabel', () => {
  it('labels a triathlon distance', () => {
    expect(getRaceDistanceLabel(triathlonGoal)).toBe('M')
  })

  it('labels a running distance', () => {
    expect(getRaceDistanceLabel(runningGoal)).toBe('Marathon')
  })
})

describe('getRecommendedMinWeeksBeginner', () => {
  it('gives the triathlon minimum runway', () => {
    expect(getRecommendedMinWeeksBeginner(triathlonGoal)).toBeGreaterThan(0)
  })

  it('gives the running minimum runway', () => {
    expect(getRecommendedMinWeeksBeginner(runningGoal)).toBe(16)
  })
})
