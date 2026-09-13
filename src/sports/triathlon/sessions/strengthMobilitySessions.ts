import { minutesToSec, RPE_RANGE, type SessionTemplate } from './common'

export const STRENGTH_SESSIONS: SessionTemplate[] = [
  {
    id: 'strength-general',
    discipline: 'strength',
    sessionType: 'strength',
    title: 'Renforcement général',
    objective:
      'Renforcer les groupes musculaires clés du triathlète (chaîne postérieure, gainage, stabilité du bassin) pour mieux tolérer la charge d\'entraînement.',
    estimatedDurationMin: 35,
    defaultPriority: 'secondary',
    blocks: [
      {
        label: 'Circuit gainage + bas du corps',
        durationSec: minutesToSec(25),
        repeat: 2,
        restSec: 60,
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
        note: 'Gainage, fentes, pont fessier, planche latérale.',
      },
    ],
  },
]

export const MOBILITY_SESSIONS: SessionTemplate[] = [
  {
    id: 'mobility-general',
    discipline: 'mobility',
    sessionType: 'mobility',
    title: 'Mobilité générale',
    objective: 'Entretenir l\'amplitude articulaire et prévenir les raideurs qui limitent la technique.',
    estimatedDurationMin: 15,
    defaultPriority: 'optional',
    blocks: [
      {
        label: 'Routine mobilité hanches/chevilles/épaules',
        durationSec: minutesToSec(15),
        targetRpeMin: RPE_RANGE.recovery[0],
        targetRpeMax: RPE_RANGE.recovery[1],
      },
    ],
  },
]
