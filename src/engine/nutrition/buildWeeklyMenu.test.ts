import { describe, expect, it } from 'vitest'
import { createNutritionPreferences } from '@/core/nutrition/NutritionPreferences'
import { createPlannedSession } from '@/core/training/PlannedSession'
import type { TrainingPlan } from '@/core/training/TrainingPlan'
import { buildWeeklyMenu } from './buildWeeklyMenu'

const PREFERENCES = createNutritionPreferences({ dietType: 'omnivore', restrictions: [], budgetTier: 'moderate' })

function plan(): TrainingPlan {
  const keySession = createPlannedSession({
    discipline: 'bike',
    sessionType: 'long',
    title: 'Sortie longue',
    objective: 'x',
    blocks: [],
    estimatedDurationMin: 120,
    priority: 'key',
    date: '2026-06-09', // Tuesday
    weekId: 'week-1',
  })
  return {
    id: 'p',
    raceGoalId: 'r',
    createdAt: '',
    weeks: [{ id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 0, sessions: [keySession] }],
    warnings: [],
  }
}

describe('buildWeeklyMenu', () => {
  it('returns one daily menu per day of the week, in order', () => {
    const menus = buildWeeklyMenu(plan(), '2026-06-08', PREFERENCES)
    expect(menus).toHaveLength(7)
    expect(menus.map((m) => m.date)).toEqual([
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
      '2026-06-13',
      '2026-06-14',
    ])
  })

  it("carb-loads the day before a key session, same as the Today screen's own logic", () => {
    const menus = buildWeeklyMenu(plan(), '2026-06-08', PREFERENCES)
    const mondayDinner = menus[0]!.entries.find((e) => e.slot === 'dinner')
    expect(mondayDinner?.meal.macroFocus).toBe('carb-heavy')
  })

  it("looks a day ahead across the week boundary (Sunday's tomorrow is next week's Monday)", () => {
    // A key session lands the Monday right after this week's Sunday.
    const nextMonday = createPlannedSession({
      discipline: 'run',
      sessionType: 'long',
      title: 'Sortie longue',
      objective: 'x',
      blocks: [],
      estimatedDurationMin: 120,
      priority: 'key',
      date: '2026-06-15',
      weekId: 'week-2',
    })
    const twoWeekPlan: TrainingPlan = {
      id: 'p',
      raceGoalId: 'r',
      createdAt: '',
      weeks: [
        { id: 'week-1', weekNumber: 1, startDate: '2026-06-08', phase: 'base', targetLoad: 0, sessions: [] },
        { id: 'week-2', weekNumber: 2, startDate: '2026-06-15', phase: 'base', targetLoad: 0, sessions: [nextMonday] },
      ],
      warnings: [],
    }
    const menus = buildWeeklyMenu(twoWeekPlan, '2026-06-08', PREFERENCES)
    const sundayDinner = menus[6]!.entries.find((e) => e.slot === 'dinner')
    expect(sundayDinner?.meal.macroFocus).toBe('carb-heavy')
  })
})
