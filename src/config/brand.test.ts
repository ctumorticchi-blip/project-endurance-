import { describe, expect, it } from 'vitest'
import { brand } from './brand'

describe('brand', () => {
  it('exposes a non-empty product name and tagline', () => {
    expect(brand.name.length).toBeGreaterThan(0)
    expect(brand.tagline.length).toBeGreaterThan(0)
  })
})
