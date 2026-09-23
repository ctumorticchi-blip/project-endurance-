import { minutesToSec, RPE_RANGE, type SessionTemplate } from './common'

export const STRENGTH_SESSIONS: SessionTemplate[] = [
  {
    id: 'strength-general',
    discipline: 'strength',
    sessionType: 'strength',
    tier: 'standard',
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
  {
    id: 'strength-maintenance',
    discipline: 'strength',
    sessionType: 'strength',
    tier: 'reduced',
    title: 'Renforcement d\'entretien',
    objective:
      "Volume réduit par rapport au renforcement général : maintient les acquis sans consommer la capacité de récupération dont les séances triathlon-spécifiques ont besoin en phase spécifique/affûtage.",
    estimatedDurationMin: 20,
    defaultPriority: 'optional',
    blocks: [
      {
        label: 'Circuit gainage + bas du corps (allégé)',
        durationSec: minutesToSec(15),
        targetRpeMin: RPE_RANGE.easy[0],
        targetRpeMax: RPE_RANGE.easy[1],
        note: 'Les mêmes mouvements que le renforcement général, un seul tour, sans chercher la fatigue.',
      },
    ],
  },
]

export const MOBILITY_SESSIONS: SessionTemplate[] = [
  {
    id: 'mobility-general',
    discipline: 'mobility',
    sessionType: 'mobility',
    tier: 'standard',
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
