import { describe, expect, it } from 'vitest'
import { formatQuantity, parsePortion } from './parsePortion'
import { MEAL_CATALOG } from '@/config/nutrition/mealCatalog'

describe('parsePortion', () => {
  it.each([
    ['150 g', { amount: 150, unit: 'g' }],
    ['70 g', { amount: 70, unit: 'g' }],
    ['250 ml', { amount: 250, unit: 'ml' }],
    ['1 cuillère à soupe', { amount: 1, unit: 'cas' }],
    ['3 cuillères à soupe', { amount: 3, unit: 'cas' }],
    ['1 cuillère à café', { amount: 1, unit: 'cac' }],
    ['2 tranches', { amount: 2, unit: 'tranche' }],
    ['1 tranche', { amount: 1, unit: 'tranche' }],
    ['1', { amount: 1, unit: 'piece' }],
    ['4', { amount: 4, unit: 'piece' }],
    ['1/2', { amount: 0.5, unit: 'piece' }],
    ['1 portion', { amount: 1, unit: 'piece' }],
    ['1 boîte (140 g)', { amount: 1, unit: 'piece' }],
    ['2 (250 g)', { amount: 2, unit: 'piece' }],
    ['1 (125 g)', { amount: 1, unit: 'piece' }],
  ] as const)('parses %s', (portion, expected) => {
    expect(parsePortion(portion)).toEqual(expected)
  })

  it.each(['une pincée', 'au goût'])('returns undefined for the qualitative portion %s', (portion) => {
    expect(parsePortion(portion)).toBeUndefined()
  })

  it('parses (or knowingly treats as qualitative) every portion string actually used in the catalog', () => {
    const QUALITATIVE = new Set(['une pincée', 'au goût'])
    const unrecognized = new Set<string>()
    for (const meal of MEAL_CATALOG) {
      for (const item of meal.items) {
        if (QUALITATIVE.has(item.portion)) continue
        if (!parsePortion(item.portion)) unrecognized.add(item.portion)
      }
    }
    expect([...unrecognized]).toEqual([])
  })
})

describe('formatQuantity', () => {
  it('formats grams and millilitres plainly', () => {
    expect(formatQuantity(220, 'g')).toBe('220 g')
    expect(formatQuantity(500, 'ml')).toBe('500 ml')
  })

  it('pluralizes spoons and slices only above 1', () => {
    expect(formatQuantity(1, 'cas')).toBe('1 cuillère à soupe')
    expect(formatQuantity(2, 'cas')).toBe('2 cuillères à soupe')
    expect(formatQuantity(1, 'tranche')).toBe('1 tranche')
    expect(formatQuantity(3, 'tranche')).toBe('3 tranches')
  })

  it('renders a piece count with no unit suffix', () => {
    expect(formatQuantity(4, 'piece')).toBe('4')
  })

  it('renders a non-integer amount with a French decimal comma', () => {
    expect(formatQuantity(1.5, 'piece')).toBe('1,5')
  })
})
