import { describe, expect, it } from 'vitest'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import { hasStructuredSections, inferBlockRole, inferBrickLeg } from './blockPresentation'

function block(overrides: Partial<WorkoutBlock> = {}): WorkoutBlock {
  return { id: 'b1', label: 'Bloc', targetRpeMin: 3, targetRpeMax: 5, ...overrides }
}

describe('inferBlockRole', () => {
  it('recognises the authored warm-up label', () => {
    expect(inferBlockRole(block({ label: 'Échauffement' }))).toBe('warmup')
  })

  it('recognises the authored cool-down label', () => {
    expect(inferBlockRole(block({ label: 'Retour au calme' }))).toBe('cooldown')
  })

  it('treats everything else as the main set', () => {
    expect(inferBlockRole(block({ label: 'Répétitions seuil' }))).toBe('main')
    expect(inferBlockRole(block({ label: 'Renforcement général' }))).toBe('main')
  })
})

describe('hasStructuredSections', () => {
  it('is false when no block has a warm-up/cool-down label (no grouping added where the data does not support it)', () => {
    expect(hasStructuredSections([block({ label: 'Répétitions T1/T2' })])).toBe(false)
  })

  it('is true once at least one block is a real warm-up or cool-down', () => {
    expect(hasStructuredSections([block({ label: 'Échauffement' }), block({ label: 'Corps de séance' })])).toBe(true)
  })
})

describe('inferBrickLeg', () => {
  it('identifies the bike leg', () => {
    expect(inferBrickLeg(block({ label: 'Vélo allure course' }))).toBe('bike')
  })

  it('identifies the run leg', () => {
    expect(inferBrickLeg(block({ label: 'Course allure course' }))).toBe('run')
  })

  it('identifies the transition', () => {
    expect(inferBrickLeg(block({ label: 'Transition rapide' }))).toBe('transition')
  })

  it('returns undefined for a label it cannot classify, never guessing', () => {
    expect(inferBrickLeg(block({ label: 'Quelque chose de non reconnu' }))).toBeUndefined()
  })
})
