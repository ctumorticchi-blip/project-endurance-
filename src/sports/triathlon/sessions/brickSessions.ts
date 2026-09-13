import { minutesToSec, RPE_RANGE, type SessionTemplate } from './common'

export const BRICK_SESSIONS: SessionTemplate[] = [
  {
    id: 'brick-short',
    discipline: 'brick',
    sessionType: 'brick',
    title: 'Brick court vélo-course',
    objective:
      'Habituer tes jambes à la sensation de course juste après le vélo — la clé du triathlon.',
    estimatedDurationMin: 60,
    defaultPriority: 'key',
    blocks: [
      {
        label: 'Vélo endurance',
        durationSec: minutesToSec(45),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      {
        label: 'Transition rapide',
        durationSec: minutesToSec(2),
        targetRpeMin: RPE_RANGE.easy[0],
        targetRpeMax: RPE_RANGE.easy[1],
        note: 'Change tes chaussures le plus vite possible, comme en course.',
      },
      {
        label: 'Course à pied',
        durationSec: minutesToSec(15),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
        note: 'Les premières minutes seront lourdes, c\'est normal — laisse tes jambes se réhabituer.',
      },
    ],
  },
  {
    id: 'brick-race-specific',
    discipline: 'brick',
    sessionType: 'race-specific',
    title: 'Brick race-specific',
    objective:
      'Répéter les allures et sensations de ta course, vélo puis course, en conditions proches du jour J.',
    estimatedDurationMin: 90,
    defaultPriority: 'key',
    blocks: [
      {
        label: 'Vélo allure course',
        durationSec: minutesToSec(60),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
      },
      {
        label: 'Transition rapide',
        durationSec: minutesToSec(2),
        targetRpeMin: RPE_RANGE.easy[0],
        targetRpeMax: RPE_RANGE.easy[1],
      },
      {
        label: 'Course allure course',
        durationSec: minutesToSec(25),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
      },
    ],
  },
  {
    id: 'transition-practice',
    discipline: 'brick',
    sessionType: 'transition',
    title: 'Pratique des transitions',
    objective: 'Automatiser les gestes de T1 (natation → vélo) et T2 (vélo → course) pour gagner du temps sans stress le jour de la course.',
    estimatedDurationMin: 30,
    defaultPriority: 'optional',
    blocks: [
      {
        label: 'Répétitions T1/T2',
        durationSec: minutesToSec(20),
        repeat: 4,
        restSec: 60,
        targetRpeMin: RPE_RANGE.easy[0],
        targetRpeMax: RPE_RANGE.easy[1],
        note: 'Enchaîne l\'habillage/déshabillage et quelques foulées ou coups de pédale.',
      },
    ],
  },
]
