import { describe, expect, it } from 'vitest'
import type { MealTemplate } from '@/config/nutrition/mealCatalog'
import { buildShoppingList } from './buildShoppingList'
import type { DailyMenu, MenuEntry } from './buildDailyMenu'

function meal(overrides: Partial<MealTemplate> & Pick<MealTemplate, 'items'>): MealTemplate {
  return {
    id: 'test-meal',
    slot: 'lunch',
    title: 'Repas test',
    rationale: 'x',
    macroFocus: 'balanced',
    costTier: 'cheap',
    compatibleDiets: ['omnivore'],
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
    ...overrides,
  }
}

function entry(m: MealTemplate, slot: MenuEntry['slot'] = 'lunch'): MenuEntry {
  return { slot, meal: m }
}

function day(date: string, entries: MenuEntry[]): DailyMenu {
  return { date, entries }
}

describe('buildShoppingList', () => {
  it('sums matching units for the same food across multiple days', () => {
    const rice = meal({ id: 'r1', items: [{ food: 'Riz (poids cru)', portion: '80 g' }] })
    const menus = [
      day('2026-06-08', [entry(rice)]),
      day('2026-06-09', [entry(rice)]),
      day('2026-06-10', [entry(rice)]),
    ]
    const lines = buildShoppingList(menus)
    const riceLine = lines.find((l) => l.food === 'Riz (poids cru)')
    expect(riceLine?.quantityLabel).toBe('240 g')
    expect(riceLine?.category).toBe('starches')
  })

  it('keeps a qualitative portion verbatim instead of fabricating a number', () => {
    const withPinch = meal({ id: 'm1', items: [{ food: 'Cannelle', portion: 'une pincée' }] })
    const lines = buildShoppingList([day('2026-06-08', [entry(withPinch)]), day('2026-06-09', [entry(withPinch)])])
    const line = lines.find((l) => l.food === 'Cannelle')
    expect(line?.quantityLabel).toBe('une pincée')
  })

  it('combines a summed unit and a qualitative portion for the same food with " + "', () => {
    const oilMeasured = meal({ id: 'm1', items: [{ food: "Huile d'olive", portion: '1 cuillère à soupe' }] })
    const oilToTaste = meal({ id: 'm2', items: [{ food: "Huile d'olive", portion: 'au goût' }] })
    const lines = buildShoppingList([day('2026-06-08', [entry(oilMeasured)]), day('2026-06-09', [entry(oilToTaste)])])
    const line = lines.find((l) => l.food === "Huile d'olive")
    expect(line?.quantityLabel).toBe('1 cuillère à soupe + au goût')
  })

  it('reflects a swapped meal — the overridden items replace the original ones entirely', () => {
    const original = meal({ id: 'o1', items: [{ food: 'Riz (poids cru)', portion: '80 g' }] })
    const swapped = meal({ id: 's1', items: [{ food: 'Quinoa (poids cru)', portion: '80 g' }] })
    // Simulates applyMealOverrides already having replaced the entry.
    const menus = [day('2026-06-08', [entry(swapped)]), day('2026-06-09', [entry(original)])]
    const lines = buildShoppingList(menus)
    expect(lines.find((l) => l.food === 'Quinoa (poids cru)')?.quantityLabel).toBe('80 g')
    expect(lines.find((l) => l.food === 'Riz (poids cru)')?.quantityLabel).toBe('80 g')
  })

  it('sorts lines alphabetically by food name', () => {
    const m = meal({
      id: 'm1',
      items: [
        { food: 'Yaourt nature', portion: '1' },
        { food: 'Avocat', portion: '1' },
      ],
    })
    const lines = buildShoppingList([day('2026-06-08', [entry(m)])])
    expect(lines.map((l) => l.food)).toEqual(['Avocat', 'Yaourt nature'])
  })

  it('returns an empty list for an empty week', () => {
    expect(buildShoppingList([])).toEqual([])
  })
})
