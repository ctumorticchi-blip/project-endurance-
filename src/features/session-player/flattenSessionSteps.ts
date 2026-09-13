import type { PlannedSession } from '@/core/training/PlannedSession'
import type { ZoneName } from '@/engine/calibration/zones'

export interface PlayerStep {
  key: string
  blockId: string
  label: string
  kind: 'work' | 'rest'
  durationSec: number
  repIndex: number
  totalReps: number
  targetZone?: ZoneName
  targetRpeMin: number
  targetRpeMax: number
  note?: string
}

/**
 * Expands a session's blocks (which may repeat, with rest between reps)
 * into a flat, linear sequence the player can step through one at a time —
 * kept out of the component so it's independently testable (brief §36).
 */
export function flattenSessionSteps(session: PlannedSession): PlayerStep[] {
  const steps: PlayerStep[] = []

  for (const block of session.blocks) {
    const totalReps = block.repeat ?? 1

    for (let rep = 1; rep <= totalReps; rep++) {
      steps.push({
        key: `${block.id}-work-${rep}`,
        blockId: block.id,
        label: block.label,
        kind: 'work',
        durationSec: block.durationSec ?? 0,
        repIndex: rep,
        totalReps,
        targetZone: block.targetZone,
        targetRpeMin: block.targetRpeMin,
        targetRpeMax: block.targetRpeMax,
        note: block.note,
      })

      if (rep < totalReps && block.restSec) {
        steps.push({
          key: `${block.id}-rest-${rep}`,
          blockId: block.id,
          label: 'Récupération',
          kind: 'rest',
          durationSec: block.restSec,
          repIndex: rep,
          totalReps,
          targetRpeMin: 1,
          targetRpeMax: 3,
        })
      }
    }
  }

  return steps
}
