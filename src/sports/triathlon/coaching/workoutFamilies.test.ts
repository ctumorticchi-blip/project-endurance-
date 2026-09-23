import { describe, expect, it } from 'vitest'
import { SESSION_CATALOG } from '@/sports/triathlon/sessions'
import { getFamilyForSession, WORKOUT_FAMILIES } from './workoutFamilies'

const ALL_FAMILIES = Object.values(WORKOUT_FAMILIES)

describe('WORKOUT_FAMILIES', () => {
  it('every family id matches its own key', () => {
    for (const [key, family] of Object.entries(WORKOUT_FAMILIES)) {
      expect(family.id).toBe(key)
    }
  })

  it('every family corresponds to at least one real catalog template (discipline + sessionType)', () => {
    for (const family of ALL_FAMILIES) {
      const hasTemplate = SESSION_CATALOG.some(
        (t) => t.discipline === family.discipline && t.sessionType === family.sessionType,
      )
      expect(hasTemplate, `${family.id} (${family.discipline}/${family.sessionType}) has no catalog template`).toBe(
        true,
      )
    }
  })

  it('every appropriatePhases entry is a valid training phase', () => {
    const validPhases = ['base', 'build', 'specific', 'taper', 'race']
    for (const family of ALL_FAMILIES) {
      for (const phase of family.appropriatePhases) {
        expect(validPhases).toContain(phase)
      }
    }
  })

  it('every compatibleNeighbors/incompatibleNeighbors reference a real family id (no typos)', () => {
    const validIds = new Set(ALL_FAMILIES.map((f) => f.id))
    for (const family of ALL_FAMILIES) {
      for (const neighborId of [...(family.compatibleNeighbors ?? []), ...(family.incompatibleNeighbors ?? [])]) {
        expect(validIds.has(neighborId), `${family.id} references unknown neighbor ${neighborId}`).toBe(true)
      }
    }
  })

  it('no family lists the same neighbor as both compatible and incompatible', () => {
    for (const family of ALL_FAMILIES) {
      const compatible = new Set(family.compatibleNeighbors ?? [])
      const incompatible = new Set(family.incompatibleNeighbors ?? [])
      const overlap = [...compatible].filter((id) => incompatible.has(id))
      expect(overlap, `${family.id} has contradictory neighbor rules`).toEqual([])
    }
  })

  it('high fatigue-cost families never have a recovery requirement of 0', () => {
    for (const family of ALL_FAMILIES) {
      if (family.fatigueCost === 'high') {
        expect(family.recoveryRequirement, `${family.id} is high-cost but claims no recovery need`).toBeGreaterThan(0)
      }
    }
  })

  it('every family has a progression ladder of at least 1 level', () => {
    for (const family of ALL_FAMILIES) {
      expect(family.progressionLevels).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('getFamilyForSession', () => {
  it('resolves a standard (discipline, sessionType) pair', () => {
    expect(getFamilyForSession('run', 'threshold')?.id).toBe('RUN_THRESHOLD')
    expect(getFamilyForSession('bike', 'endurance')?.id).toBe('BIKE_ENDURANCE')
    expect(getFamilyForSession('swim', 'css')?.id).toBe('SWIM_CSS')
  })

  it('disambiguates bike vs run technique families by discipline', () => {
    expect(getFamilyForSession('bike', 'technique')?.id).toBe('BIKE_CADENCE')
    expect(getFamilyForSession('run', 'technique')?.id).toBe('RUN_STRIDES')
  })

  it('returns undefined for a pair with no registered family', () => {
    expect(getFamilyForSession('mobility', 'threshold')).toBeUndefined()
  })

  it('resolves the more common brick race-specific family for the shared (brick, race-specific) pair', () => {
    // BRICK_SPECIFIC and BRICK_RACE_REHEARSAL intentionally share
    // discipline+sessionType (they differ by tier in the catalog, not by
    // sessionType) — the lookup deterministically favors the everyday one.
    expect(getFamilyForSession('brick', 'race-specific')?.id).toBe('BRICK_SPECIFIC')
  })
})
