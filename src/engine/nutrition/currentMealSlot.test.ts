import { describe, expect, it } from 'vitest'
import { currentMealSlot } from './currentMealSlot'

describe('currentMealSlot', () => {
  it('returns breakfast between 5h and 11h', () => {
    expect(currentMealSlot(5)).toBe('breakfast')
    expect(currentMealSlot(8)).toBe('breakfast')
    expect(currentMealSlot(10)).toBe('breakfast')
  })

  it('returns lunch between 11h and 16h', () => {
    expect(currentMealSlot(11)).toBe('lunch')
    expect(currentMealSlot(13)).toBe('lunch')
    expect(currentMealSlot(15)).toBe('lunch')
  })

  it('returns dinner between 16h and 22h', () => {
    expect(currentMealSlot(16)).toBe('dinner')
    expect(currentMealSlot(19)).toBe('dinner')
    expect(currentMealSlot(21)).toBe('dinner')
  })

  it('returns undefined late at night and early morning', () => {
    expect(currentMealSlot(22)).toBeUndefined()
    expect(currentMealSlot(0)).toBeUndefined()
    expect(currentMealSlot(4)).toBeUndefined()
  })
})
