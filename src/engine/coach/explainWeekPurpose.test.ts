import { describe, expect, it } from 'vitest'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPhaseName, TrainingWeek } from '@/core/training/TrainingPlan'
import type { DisciplineStrengthAnalysis } from '@/sports/triathlon/coaching/limiterAnalysis'
import { explainWeekComposition, explainWeekPurpose } from './explainWeekPurpose'

describe('explainWeekPurpose', () => {
  it('gives a distinct, non-empty explanation for every training phase', () => {
    const phases: TrainingPhaseName[] = ['base', 'build', 'specific', 'taper', 'race']
    const explanations = phases.map(explainWeekPurpose)
    for (const explanation of explanations) {
      expect(explanation.length).toBeGreaterThan(0)
    }
    expect(new Set(explanations).size).toBe(phases.length)
  })
})

function sessionOf(discipline: PlannedSession['discipline']): PlannedSession {
  return {
    id: discipline,
    discipline,
    sessionType: 'endurance',
    title: discipline,
    objective: '',
    blocks: [],
    estimatedDurationMin: 45,
    plannedDurationMin: 45,
    plannedBlocks: [],
    priority: 'key',
    date: '2026-01-05',
    weekId: 'week-1',
  }
}

function week(sessions: PlannedSession[], phase: TrainingPhaseName = 'build'): TrainingWeek {
  return { id: 'week-1', weekNumber: 1, startDate: '2026-01-05', phase, targetLoad: 100, sessions }
}

function limiterAnalysis(overrides: Partial<DisciplineStrengthAnalysis> = {}): DisciplineStrengthAnalysis {
  return {
    levels: { swim: 'beginner', bike: 'intermediate', run: 'advanced' },
    limiter: 'swim',
    strongest: 'run',
    isBalanced: false,
    hasTestedMetric: { swim: false, bike: false, run: false },
    explanation: 'generic athlete-level explanation',
    ...overrides,
  }
}

describe('explainWeekComposition', () => {
  it('always includes the phase intro, matching explainWeekPurpose', () => {
    const composition = explainWeekComposition(week([]))
    expect(composition.phaseIntro).toBe(explainWeekPurpose('build'))
  })

  it('omits the limiter note for a balanced athlete', () => {
    const composition = explainWeekComposition(
      week([sessionOf('swim'), sessionOf('bike')]),
      limiterAnalysis({ isBalanced: true }),
    )
    expect(composition.limiterNote).toBeUndefined()
  })

  it('omits the limiter note in race week (composition reasoning does not matter days before the start line)', () => {
    const composition = explainWeekComposition(
      week([sessionOf('swim'), sessionOf('swim')], 'race'),
      limiterAnalysis(),
    )
    expect(composition.limiterNote).toBeUndefined()
  })

  it('omits the limiter note when the limiter genuinely got no session this week (honest, not fabricated)', () => {
    const composition = explainWeekComposition(week([sessionOf('bike'), sessionOf('run')]), limiterAnalysis())
    expect(composition.limiterNote).toBeUndefined()
  })

  it('derives the limiter note from the real per-discipline session counts, not a generic template', () => {
    const composition = explainWeekComposition(
      week([sessionOf('swim'), sessionOf('swim'), sessionOf('run')]),
      limiterAnalysis(),
    )
    expect(composition.limiterNote).toContain('2 séances')
    expect(composition.limiterNote).toContain('1 en course')
  })
})
