import {
  cooldownBlock,
  minutesToSec,
  RPE_RANGE,
  warmupBlock,
  type SessionTemplate,
} from '@/sports/triathlon/sessions/common'

/**
 * Running's own session catalog — grounded in the training paces and
 * session structures most widely used across recreational-to-competitive
 * running coaching: Jack Daniels' Running Formula (E/M/T/I/R pace system —
 * this catalog's tempo/threshold/intervals split mirrors his T/I paces),
 * Pete Pfitzinger's "Advanced Marathoning" (LT-focused threshold work,
 * marathon-pace-in-the-long-run), Hansons Marathon Method (the "SOS"
 * long-run-with-fast-finish, cumulative-fatigue philosophy), Arthur
 * Lydiard (aerobic-base-first periodization, hill repeats for
 * strength-endurance without pure speed risk), Renato Canova (varied,
 * specific-pace block work for 5K/10K), Gösta Holmér's fartlek tradition
 * (unstructured speed play — accessible, low-intimidation variety), and
 * Jeff Galloway (strides for neuromuscular sharpness, run-walk-run
 * accessibility for beginners). `sessionType` reuses the existing
 * triathlon-authored `SessionType` union rather than adding new values —
 * every type used below (recovery/endurance/long/tempo/threshold/
 * intervals/race-specific) already has a real, tested meaning across the
 * engine (adaptation, load estimation), so running slots into it exactly
 * rather than needing engine changes.
 */
export const RUNNING_SESSIONS: SessionTemplate[] = [
  // --- Footing facile / récupération — la base aérobie (Lydiard, Daniels'
  // "E" pace) : l'immense majorité du volume d'un coureur, quel que soit
  // son niveau. ---
  {
    id: 'running-recovery',
    discipline: 'run',
    sessionType: 'recovery',
    tier: 'standard',
    title: 'Footing récupération',
    objective:
      "Récupérer activement par un footing très facile, allure conversationnelle sans y penser (Daniels : allure E, la plus facile de toutes).",
    estimatedDurationMin: 25,
    defaultPriority: 'optional',
    blocks: [
      {
        label: 'Footing très facile',
        durationSec: minutesToSec(25),
        targetZone: 'Z1',
        targetRpeMin: RPE_RANGE.recovery[0],
        targetRpeMax: RPE_RANGE.recovery[1],
      },
    ],
  },
  {
    id: 'running-easy',
    discipline: 'run',
    sessionType: 'endurance',
    tier: 'standard',
    title: 'Footing facile',
    objective:
      "Construire ta base aérobie à allure E (Daniels) — le rythme où tu pourrais tenir une conversation sans effort. C'est ce volume facile qui construit la capillarisation et l'endurance de fond, pas les séances rapides.",
    estimatedDurationMin: 45,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(5),
      {
        label: 'Footing Z2',
        durationSec: minutesToSec(35),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      cooldownBlock(5),
    ],
  },
  {
    id: 'running-easy-strides',
    discipline: 'run',
    sessionType: 'endurance',
    tier: 'standard',
    title: 'Footing facile + lignes droites',
    objective:
      "Même base aérobie qu'un footing facile, avec quelques accélérations courtes en fin de séance (strides à la Galloway/Daniels) pour entretenir ta fréquence de foulée et ton relâchement — sans la fatigue d'une vraie séance de vitesse.",
    estimatedDurationMin: 45,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(5),
      {
        label: 'Footing Z2',
        durationSec: minutesToSec(30),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      {
        label: 'Lignes droites (strides)',
        durationSec: 20,
        repeat: 6,
        restSec: 60,
        targetZone: 'Z4',
        targetRpeMin: RPE_RANGE.threshold[0],
        targetRpeMax: RPE_RANGE.threshold[1],
        note: 'Accélération progressive jusqu\'à environ 90% de ta vitesse max, jamais à fond — relâché, pas crispé.',
      },
      cooldownBlock(5),
    ],
  },

  // --- Sortie longue — l'ancre de chaque semaine, quelle que soit la
  // distance visée (Pfitzinger, Hansons). Trois structures standard pour
  // varier le stimulus d'un tour de rotation à l'autre : classique,
  // finish rapide (Hansons), et allure marathon dedans (Pfitzinger). ---
  {
    id: 'running-long-minimal',
    discipline: 'run',
    sessionType: 'long',
    tier: 'minimal',
    title: 'Sortie longue (très allégée)',
    objective: "Garder le contact avec la durée à quelques jours de la course, sans entamer ta fraîcheur.",
    estimatedDurationMin: 35,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(5),
      {
        label: 'Endurance fondamentale',
        durationSec: minutesToSec(25),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      cooldownBlock(5),
    ],
  },
  {
    id: 'running-long-reduced',
    discipline: 'run',
    sessionType: 'long',
    tier: 'reduced',
    title: 'Sortie longue (allégée)',
    objective: 'Garder le contact avec la durée pendant une semaine de récupération du bloc.',
    estimatedDurationMin: 55,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(5),
      {
        label: 'Endurance fondamentale',
        durationSec: minutesToSec(45),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      cooldownBlock(5),
    ],
  },
  {
    id: 'running-long-standard',
    discipline: 'run',
    sessionType: 'long',
    tier: 'standard',
    title: 'Sortie longue',
    objective:
      "Développer ton endurance de fond et ta résistance à la fatigue sur la durée — la séance la plus importante de la semaine pour toute distance à partir du 10 km.",
    estimatedDurationMin: 90,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(10),
      {
        label: 'Endurance fondamentale',
        durationSec: minutesToSec(70),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-long-fast-finish',
    discipline: 'run',
    sessionType: 'long',
    tier: 'standard',
    title: 'Sortie longue avec finish rapide',
    objective:
      "Même durée que la sortie longue classique, avec le dernier quart accéléré vers l'allure seuil (méthode Hansons) — habitue tes jambes à accélérer sur de la fatigue accumulée, exactement la sensation de fin de course.",
    estimatedDurationMin: 90,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(10),
      {
        label: 'Endurance fondamentale',
        durationSec: minutesToSec(55),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      {
        label: 'Finish accéléré (allure seuil)',
        durationSec: minutesToSec(15),
        targetZone: 'Z4',
        targetRpeMin: RPE_RANGE.threshold[0],
        targetRpeMax: RPE_RANGE.threshold[1],
        note: 'Les derniers kilomètres, progressivement plus vite, sans jamais sprinter.',
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-long-marathon-pace',
    discipline: 'run',
    sessionType: 'long',
    tier: 'standard',
    title: 'Sortie longue avec bloc allure course',
    objective:
      "Insère un bloc à ton allure cible de course au cœur de la sortie longue (méthode Pfitzinger) — la façon la plus spécifique de préparer un semi ou un marathon : tu répètes l'allure exacte sur de la fatigue déjà installée.",
    estimatedDurationMin: 95,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(15),
      {
        label: 'Endurance fondamentale',
        durationSec: minutesToSec(25),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      {
        label: 'Bloc allure course',
        durationSec: minutesToSec(30),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
        note: "À ton allure cible de course, pas plus vite — l'objectif est la spécificité, pas la performance du jour.",
      },
      {
        label: 'Retour au calme actif',
        durationSec: minutesToSec(15),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-long-peak',
    discipline: 'run',
    sessionType: 'long',
    tier: 'peak',
    title: 'Sortie longue (semaine de pointe)',
    objective: 'La sortie longue la plus exigeante du bloc spécifique, juste avant l\'affûtage.',
    estimatedDurationMin: 120,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(10),
      {
        label: 'Endurance fondamentale',
        durationSec: minutesToSec(90),
        targetZone: 'Z2',
        targetRpeMin: RPE_RANGE.endurance[0],
        targetRpeMax: RPE_RANGE.endurance[1],
      },
      {
        label: 'Finish accéléré',
        durationSec: minutesToSec(15),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
      },
      cooldownBlock(5),
    ],
  },

  // --- Tempo (allure T continue) et fartlek (jeu de vitesse) — Daniels'
  // "T" pace pour l'un, la tradition suédoise du fartlek (Gösta Holmér)
  // pour l'autre : deux façons différentes de développer le même système,
  // en alternance pour varier le stimulus et rester accessible aux
  // amateurs (le fartlek est moins intimidant qu'une séance chronométrée). ---
  {
    id: 'running-tempo-minimal',
    discipline: 'run',
    sessionType: 'tempo',
    tier: 'minimal',
    title: 'Tempo (très allégé)',
    objective: 'Garder la sensation de rythme sans entamer la fraîcheur à quelques jours de la course.',
    estimatedDurationMin: 25,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(8),
      {
        label: 'Bloc tempo',
        durationSec: minutesToSec(8),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
      },
      cooldownBlock(9),
    ],
  },
  {
    id: 'running-tempo-reduced',
    discipline: 'run',
    sessionType: 'tempo',
    tier: 'reduced',
    title: 'Tempo (allégé)',
    objective: 'Entretenir l\'allure tempo pendant une semaine de récupération du bloc.',
    estimatedDurationMin: 38,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(10),
      {
        label: 'Bloc tempo',
        durationSec: minutesToSec(16),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
      },
      cooldownBlock(12),
    ],
  },
  {
    id: 'running-tempo-continuous',
    discipline: 'run',
    sessionType: 'tempo',
    tier: 'standard',
    title: 'Tempo continu',
    objective:
      "Allure T (Daniels) : \"comfortably hard\", un effort soutenu mais contrôlé que tu pourrais tenir environ une heure en course. Développe ton endurance à allure de course sans la fatigue d'un vrai effort au seuil.",
    estimatedDurationMin: 50,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(12),
      {
        label: 'Bloc tempo',
        durationSec: minutesToSec(25),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
      },
      cooldownBlock(13),
    ],
  },
  {
    id: 'running-fartlek',
    discipline: 'run',
    sessionType: 'tempo',
    tier: 'standard',
    title: 'Fartlek',
    objective:
      "Jeu de vitesse suédois (Gösta Holmér) : alterne des portions rapides et faciles au feeling, sans chrono précis. Développe le même système que le tempo continu, en plus ludique et moins intimidant — idéal pour varier ou pour un profil amateur.",
    estimatedDurationMin: 45,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(10),
      {
        label: 'Portions rapides / faciles alternées',
        durationSec: minutesToSec(3),
        repeat: 6,
        restSec: minutesToSec(2),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
        note: "Accélère au feeling pendant 2-3 minutes, puis reviens à un footing facile jusqu'à récupération — pas besoin d'allure précise.",
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-tempo-peak',
    discipline: 'run',
    sessionType: 'tempo',
    tier: 'peak',
    title: 'Tempo (semaine de pointe)',
    objective: 'La semaine la plus chargée du bloc pour le tempo continu.',
    estimatedDurationMin: 55,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(12),
      {
        label: 'Bloc tempo',
        durationSec: minutesToSec(32),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
      },
      cooldownBlock(11),
    ],
  },

  // --- Seuil (allure T en fractionné / "cruise intervals") — la clé de la
  // phase spécifique pour repousser le seuil lactique (Daniels, Pfitzinger). ---
  {
    id: 'running-threshold-reduced',
    discipline: 'run',
    sessionType: 'threshold',
    tier: 'reduced',
    title: 'Seuil (allégé)',
    objective: 'Entretenir le seuil pendant une semaine de récupération du bloc spécifique.',
    estimatedDurationMin: 36,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(10),
      {
        label: 'Cruise intervals',
        durationSec: minutesToSec(6),
        repeat: 2,
        restSec: 60,
        targetZone: 'Z4',
        targetRpeMin: RPE_RANGE.threshold[0],
        targetRpeMax: RPE_RANGE.threshold[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-threshold-mile-reps',
    discipline: 'run',
    sessionType: 'threshold',
    tier: 'standard',
    title: 'Seuil — répétitions longues',
    objective:
      "\"Cruise intervals\" (Daniels) : répétitions de 6-8 minutes à allure seuil avec une courte récupération — repousse ton seuil lactique sans accumuler autant de fatigue qu'un effort continu de même durée totale.",
    estimatedDurationMin: 52,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(12),
      {
        label: 'Cruise intervals',
        durationSec: minutesToSec(8),
        repeat: 3,
        restSec: 90,
        targetZone: 'Z4',
        targetRpeMin: RPE_RANGE.threshold[0],
        targetRpeMax: RPE_RANGE.threshold[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-threshold-short-reps',
    discipline: 'run',
    sessionType: 'threshold',
    tier: 'standard',
    title: 'Seuil — répétitions courtes',
    objective: 'Même charge totale au seuil que les répétitions longues, fractionnée en blocs plus courts et plus nombreux pour varier le stimulus.',
    estimatedDurationMin: 48,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(10),
      {
        label: 'Cruise intervals (courtes)',
        durationSec: minutesToSec(4),
        repeat: 5,
        restSec: 60,
        targetZone: 'Z4',
        targetRpeMin: RPE_RANGE.threshold[0],
        targetRpeMax: RPE_RANGE.threshold[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-threshold-peak',
    discipline: 'run',
    sessionType: 'threshold',
    tier: 'peak',
    title: 'Seuil (semaine de pointe)',
    objective: 'La semaine la plus exigeante du bloc spécifique : plus de temps passé au seuil.',
    estimatedDurationMin: 60,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(12),
      {
        label: 'Cruise intervals',
        durationSec: minutesToSec(8),
        repeat: 4,
        restSec: 90,
        targetZone: 'Z4',
        targetRpeMin: RPE_RANGE.threshold[0],
        targetRpeMax: RPE_RANGE.threshold[1],
      },
      cooldownBlock(10),
    ],
  },

  // --- VO2max (allure I) et côtes — Daniels' "I" pace pour développer la
  // VMA, Lydiard pour les côtes (force-endurance sans le risque de blessure
  // de la vitesse pure sur plat), en rotation pour varier le stimulus
  // (Canova : varier les formats de travail spécifique plutôt que répéter
  // toujours la même séance). ---
  {
    id: 'running-intervals-reduced',
    discipline: 'run',
    sessionType: 'intervals',
    tier: 'reduced',
    title: 'VO2max (allégé)',
    objective: 'Entretenir la VO2max pendant une semaine de récupération du bloc.',
    estimatedDurationMin: 35,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(12),
      {
        label: '600m rapide',
        durationSec: minutesToSec(3),
        repeat: 4,
        restSec: 90,
        targetZone: 'Z5',
        targetRpeMin: RPE_RANGE.vo2max[0],
        targetRpeMax: RPE_RANGE.vo2max[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-intervals-1000m',
    discipline: 'run',
    sessionType: 'intervals',
    tier: 'standard',
    title: 'VO2max — 1000m',
    objective:
      "Allure I (Daniels) : répétitions de 1000m à allure VO2max avec récupération égale au temps d'effort — développe ta puissance aérobie maximale, le facteur limitant principal sur 5K/10K.",
    estimatedDurationMin: 48,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(15),
      {
        label: '1000m rapide',
        durationSec: minutesToSec(4),
        repeat: 5,
        restSec: minutesToSec(2),
        targetZone: 'Z5',
        targetRpeMin: RPE_RANGE.vo2max[0],
        targetRpeMax: RPE_RANGE.vo2max[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-intervals-400m',
    discipline: 'run',
    sessionType: 'intervals',
    tier: 'standard',
    title: 'VO2max — 400m',
    objective: 'Même stimulus VO2max que les 1000m, en répétitions plus courtes et plus nombreuses pour varier la sensation de course.',
    estimatedDurationMin: 45,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(15),
      {
        label: '400m rapide',
        durationSec: minutesToSec(2),
        repeat: 8,
        restSec: 90,
        targetZone: 'Z5',
        targetRpeMin: RPE_RANGE.vo2max[0],
        targetRpeMax: RPE_RANGE.vo2max[1],
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-hill-repeats',
    discipline: 'run',
    sessionType: 'intervals',
    tier: 'standard',
    title: 'Côtes',
    objective:
      "Répétitions en côte (Lydiard) : développe ta force-endurance et ta VO2max avec une charge articulaire plus douce que les fractionnés sur plat — la récupération en descente au trot remplace le chrono. Excellent pour la robustesse générale, pas seulement pour un objectif de vitesse.",
    estimatedDurationMin: 45,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(15),
      {
        label: 'Montée soutenue',
        durationSec: 60,
        repeat: 8,
        restSec: 90,
        targetZone: 'Z5',
        targetRpeMin: RPE_RANGE.vo2max[0],
        targetRpeMax: RPE_RANGE.vo2max[1],
        note: 'Effort soutenu en montée, redescente au trot facile comme récupération.',
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-intervals-peak',
    discipline: 'run',
    sessionType: 'intervals',
    tier: 'peak',
    title: 'VO2max (semaine de pointe)',
    objective: 'La semaine la plus exigeante du bloc pour la VO2max, avant d\'entamer l\'affûtage.',
    estimatedDurationMin: 55,
    defaultPriority: 'secondary',
    blocks: [
      warmupBlock(15),
      {
        label: '1000m rapide',
        durationSec: minutesToSec(4),
        repeat: 6,
        restSec: minutesToSec(2),
        targetZone: 'Z5',
        targetRpeMin: RPE_RANGE.vo2max[0],
        targetRpeMax: RPE_RANGE.vo2max[1],
      },
      cooldownBlock(10),
    ],
  },

  // --- Allure de course — tune-up pour affiner ta sensation d'allure
  // cible juste avant l'objectif (utile pour toutes les distances, mais
  // structuré différemment pour un 5K/10K court vs un semi/marathon plus
  // proche du rythme de croisière). ---
  {
    id: 'running-race-pace-short',
    discipline: 'run',
    sessionType: 'race-specific',
    tier: 'standard',
    title: 'Répétitions allure course (5K/10K)',
    objective:
      "Répète ton allure cible de 5K ou 10K par blocs courts et contrôlés — affine ta sensation de rythme sans le stress d'un effort continu à cette intensité.",
    estimatedDurationMin: 40,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(12),
      {
        label: 'Bloc allure course',
        durationSec: minutesToSec(4),
        repeat: 3,
        restSec: minutesToSec(2),
        targetZone: 'Z4',
        targetRpeMin: RPE_RANGE.threshold[0],
        targetRpeMax: RPE_RANGE.threshold[1],
        note: 'À ton allure cible de course exacte — ni plus vite, ni plus lent.',
      },
      cooldownBlock(10),
    ],
  },
  {
    id: 'running-race-pace-long',
    discipline: 'run',
    sessionType: 'race-specific',
    tier: 'standard',
    title: 'Bloc allure course (semi/marathon)',
    objective:
      "Un bloc continu à ton allure cible de semi ou marathon — la répétition la plus spécifique possible de ta sensation de course, hors sortie longue.",
    estimatedDurationMin: 50,
    defaultPriority: 'key',
    blocks: [
      warmupBlock(12),
      {
        label: 'Bloc allure course',
        durationSec: minutesToSec(28),
        targetZone: 'Z3',
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
        note: 'À ton allure cible de course exacte, en continu.',
      },
      cooldownBlock(10),
    ],
  },

  // --- Renforcement — spécifique coureur (hanches/gainage/mollet-tendon
  // d'Achille), la prévention de blessure la plus documentée pour cette
  // population (Pfitzinger, Hansons recommandent tous deux 1-2 séances/
  // semaine). ---
  {
    id: 'running-strength',
    discipline: 'strength',
    sessionType: 'strength',
    tier: 'standard',
    title: 'Renforcement spécifique coureur',
    objective:
      "Renforce les zones les plus sollicitées et les plus souvent blessées chez le coureur — stabilité de hanche, gainage, mollet et tendon d'Achille — pour mieux tolérer le volume de course sans te blesser.",
    estimatedDurationMin: 30,
    defaultPriority: 'secondary',
    blocks: [
      {
        label: 'Circuit hanches + gainage + mollets',
        durationSec: minutesToSec(22),
        repeat: 2,
        restSec: 60,
        targetRpeMin: RPE_RANGE.tempo[0],
        targetRpeMax: RPE_RANGE.tempo[1],
        note: 'Pont fessier unilatéral, planche, montées sur pointe de pied, gainage latéral.',
      },
    ],
  },
]
