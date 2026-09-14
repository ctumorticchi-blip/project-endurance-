import { describe, expect, it } from 'vitest'
import { calculatePowerToWeight } from './powerToWeight'

describe('calculatePowerToWeight', () => {
  it('returns undefined when FTP is unknown', () => {
    expect(calculatePowerToWeight(undefined, 70, 'male')).toBeUndefined()
  })

  it('returns undefined when weight is unknown', () => {
    expect(calculatePowerToWeight(250, undefined, 'male')).toBeUndefined()
  })

  it('computes watts per kg', () => {
    const result = calculatePowerToWeight(250, 70, 'male')
    expect(result?.wattsPerKg).toBeCloseTo(3.57, 2)
  })

  it('assigns a category for a declared male sex', () => {
    const result = calculatePowerToWeight(300, 70, 'male') // ~4.29 W/kg
    expect(result?.category).toBe('Avancé')
  })

  it('assigns a category for a declared female sex, using a different band', () => {
    const maleResult = calculatePowerToWeight(210, 70, 'male') // 3.0 W/kg
    const femaleResult = calculatePowerToWeight(210, 70, 'female') // same 3.0 W/kg
    expect(maleResult?.category).not.toBe(femaleResult?.category)
  })

  it('omits the category entirely when sex is unspecified rather than guessing', () => {
    const result = calculatePowerToWeight(250, 70, 'unspecified')
    expect(result?.wattsPerKg).toBeDefined()
    expect(result?.category).toBeUndefined()
  })

  it('omits the category when sex was never declared', () => {
    const result = calculatePowerToWeight(250, 70, undefined)
    expect(result?.category).toBeUndefined()
  })
})
