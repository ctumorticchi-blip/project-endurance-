import { describe, expect, it } from 'vitest'
import { createNutritionPreferences } from '@/core/nutrition/NutritionPreferences'
import { createPlannedSession } from '@/core/training/PlannedSession'
import { buildDailyMenu, getMealAlternatives, pickMeal } from './buildDailyMenu'

function session(overrides: Partial<Parameters<typeof createPlannedSession>[0]>) {
  return createPlannedSession({
    discipline: 'bike',
    sessionType: 'endurance',
    title: 'Endurance vélo',
    objective: 'x',
    blocks: [],
    estimatedDurationMin: 60,
    priority: 'secondary',
    date: '2026-06-10',
    weekId: 'week-1',
    ...overrides,
  })
}

const OMNIVORE_MODERATE = createNutritionPreferences({
  dietType: 'omnivore',
  restrictions: [],
  budgetTier: 'moderate',
})

const VEGAN_TIGHT_GF_NF = createNutritionPreferences({
  dietType: 'vegan',
  restrictions: ['gluten-free', 'nut-free'],
  budgetTier: 'tight',
})

describe('pickMeal', () => {
  it('never picks a meal incompatible with the declared diet', () => {
    const meal = pickMeal('lunch', createNutritionPreferences({ dietType: 'vegan', restrictions: [], budgetTier: 'high' }), 'seed')
    expect(meal?.compatibleDiets).toContain('vegan')
  })

  it('never picks a meal containing a declared allergen, even under the strictest combination', () => {
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      const meal = pickMeal(slot, VEGAN_TIGHT_GF_NF, `seed-${slot}`)
      expect(meal, `no safe ${slot} found`).toBeDefined()
      expect(meal!.containsGluten).toBe(false)
      expect(meal!.containsNuts).toBe(false)
      expect(meal!.compatibleDiets).toContain('vegan')
    }
  })

  it('prefers a cheap meal on a tight budget when a safe cheap option exists', () => {
    const meal = pickMeal('lunch', VEGAN_TIGHT_GF_NF, 'seed')
    expect(meal?.costTier).toBe('cheap')
  })

  it('is deterministic for the same seed', () => {
    const a = pickMeal('dinner', OMNIVORE_MODERATE, 'same-seed')
    const b = pickMeal('dinner', OMNIVORE_MODERATE, 'same-seed')
    expect(a?.id).toBe(b?.id)
  })

  it('varies across different seeds (real rotation, not always the same meal)', () => {
    const picks = new Set(
      Array.from({ length: 10 }, (_, i) => pickMeal('dinner', OMNIVORE_MODERATE, `seed-${i}`)?.id),
    )
    expect(picks.size).toBeGreaterThan(1)
  })

  it('prefers a macro-focus match when one is requested and available', () => {
    const meal = pickMeal('dinner', OMNIVORE_MODERATE, 'seed', 'carb-heavy')
    expect(meal?.macroFocus).toBe('carb-heavy')
  })
})

describe('getMealAlternatives', () => {
  it('only returns options compatible with the declared diet and restrictions', () => {
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      const alternatives = getMealAlternatives(slot, VEGAN_TIGHT_GF_NF)
      expect(alternatives.length).toBeGreaterThan(0)
      for (const meal of alternatives) {
        expect(meal.compatibleDiets).toContain('vegan')
        expect(meal.containsGluten).toBe(false)
        expect(meal.containsNuts).toBe(false)
      }
    }
  })

  it('includes more than one option for a loose (omnivore, no restrictions) profile', () => {
    const alternatives = getMealAlternatives('dinner', OMNIVORE_MODERATE)
    expect(alternatives.length).toBeGreaterThan(1)
  })
})

describe('buildDailyMenu', () => {
  it('always includes breakfast, lunch and dinner', () => {
    const menu = buildDailyMenu({
      date: '2026-06-10',
      session: undefined,
      nextSession: undefined,
      preferences: OMNIVORE_MODERATE,
    })
    const slots = menu.entries.map((e) => e.slot)
    expect(slots).toContain('breakfast')
    expect(slots).toContain('lunch')
    expect(slots).toContain('dinner')
  })

  it('does not add a snack on a light training day', () => {
    const menu = buildDailyMenu({
      date: '2026-06-10',
      session: session({ priority: 'secondary', estimatedDurationMin: 40 }),
      nextSession: undefined,
      preferences: OMNIVORE_MODERATE,
    })
    expect(menu.entries.some((e) => e.slot === 'snack')).toBe(false)
  })

  it('adds a recovery snack after a key session', () => {
    const menu = buildDailyMenu({
      date: '2026-06-10',
      session: session({ priority: 'key', estimatedDurationMin: 70 }),
      nextSession: undefined,
      preferences: OMNIVORE_MODERATE,
    })
    const snack = menu.entries.find((e) => e.slot === 'snack')
    expect(snack).toBeDefined()
    expect(snack?.meal.macroFocus).toBe('protein-recovery')
    expect(snack?.contextNote).toMatch(/récupération/)
  })

  it('adds a recovery snack after a long (>=90min) session even if not marked key', () => {
    const menu = buildDailyMenu({
      date: '2026-06-10',
      session: session({ priority: 'secondary', estimatedDurationMin: 95 }),
      nextSession: undefined,
      preferences: OMNIVORE_MODERATE,
    })
    expect(menu.entries.some((e) => e.slot === 'snack')).toBe(true)
  })

  it('biases dinner toward carb-loading when tomorrow has a key/long session', () => {
    const menu = buildDailyMenu({
      date: '2026-06-10',
      session: undefined,
      nextSession: session({ priority: 'key', estimatedDurationMin: 120, date: '2026-06-11' }),
      preferences: OMNIVORE_MODERATE,
    })
    const dinner = menu.entries.find((e) => e.slot === 'dinner')
    expect(dinner?.meal.macroFocus).toBe('carb-heavy')
    expect(dinner?.contextNote).toMatch(/demain/)
  })

  it('biases dinner toward recovery when today (not tomorrow) had the key session', () => {
    const menu = buildDailyMenu({
      date: '2026-06-10',
      session: session({ priority: 'key', estimatedDurationMin: 120 }),
      nextSession: undefined,
      preferences: OMNIVORE_MODERATE,
    })
    const dinner = menu.entries.find((e) => e.slot === 'dinner')
    expect(dinner?.meal.macroFocus).toBe('protein-recovery')
  })

  it('produces a fully safe menu for the strictest diet/allergen combination on a key-session day', () => {
    const menu = buildDailyMenu({
      date: '2026-06-10',
      session: session({ priority: 'key', estimatedDurationMin: 100 }),
      nextSession: undefined,
      preferences: VEGAN_TIGHT_GF_NF,
    })
    for (const entry of menu.entries) {
      expect(entry.meal.compatibleDiets).toContain('vegan')
      expect(entry.meal.containsGluten).toBe(false)
      expect(entry.meal.containsNuts).toBe(false)
    }
  })

  it('is deterministic for the same date (same menu if generated twice)', () => {
    const input = {
      date: '2026-06-10' as const,
      session: session({ priority: 'key', estimatedDurationMin: 100 }),
      nextSession: undefined,
      preferences: OMNIVORE_MODERATE,
    }
    const a = buildDailyMenu(input)
    const b = buildDailyMenu(input)
    expect(a.entries.map((e) => e.meal.id)).toEqual(b.entries.map((e) => e.meal.id))
  })
})
