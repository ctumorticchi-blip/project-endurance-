import type { RaceGoal } from '@/core/goals/RaceGoal'
import type { RunningDistance } from '@/sports/running/domain/distance'
import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import type { Discipline } from '@/shared/types/common'

export interface FuelingGuidance {
  title: string
  before: string
  during: string
  after: string
}

/** Widely-cited general endurance-nutrition ranges (g of carbs / ml of
 * fluid per kg of body weight per hour) — the same bounds sports-nutrition
 * guidelines give per kilogram, just applied to the athlete's own declared
 * weight instead of shown as a duration-only range. Still a range, still
 * "to adjust for how much you sweat" — a calculation from a declared
 * number is honest; anything narrower would be false precision. */
const CARBS_PER_KG_PER_HOUR: [number, number] = [0.6, 1.0]
const FLUID_ML_PER_KG_PER_HOUR: [number, number] = [6, 8]

function longSessionDuringNote(discipline: Discipline, weightKg: number | undefined): string {
  if (discipline === 'swim') {
    return "En natation, difficile de s'alimenter pendant l'effort : mise plutôt sur un bon apport avant et juste après."
  }
  if (!weightKg) {
    return '30 à 60 g de glucides par heure (gels, barres, boisson énergétique) et 500 à 750 ml d’eau par heure, à ajuster selon ta transpiration.'
  }
  const [carbsLow, carbsHigh] = CARBS_PER_KG_PER_HOUR
  const [fluidLow, fluidHigh] = FLUID_ML_PER_KG_PER_HOUR
  const carbsRange = `${Math.round(weightKg * carbsLow)} à ${Math.round(weightKg * carbsHigh)} g`
  const fluidRange = `${Math.round(weightKg * fluidLow)} à ${Math.round(weightKg * fluidHigh)} ml`
  return `${carbsRange} de glucides par heure (gels, barres, boisson énergétique) et ${fluidRange} d’eau par heure — calculé à partir de ton poids (${weightKg} kg), à ajuster selon ta transpiration.`
}

/**
 * General endurance-sports fueling guidance, bucketed by session duration
 * — the dominant factor — with a per-discipline note only where it
 * actually changes the advice (swim: fueling during the effort is
 * impractical). When a body weight is declared, the long-session carb/
 * fluid range is computed from it (still a range, still widely-cited
 * public guidance per kg — never a fabricated single number); otherwise
 * it falls back to the same duration-only range as before (brief: no
 * false precision).
 */
export function getFuelingGuidance(
  session: { discipline: Discipline; estimatedDurationMin: number } | undefined,
  weightKg?: number,
): FuelingGuidance {
  if (!session) {
    return {
      title: 'Jour de repos',
      before: 'Pas de préparation particulière nécessaire.',
      during: '—',
      after:
        "Un jour de repos est aussi un bon moment pour bien manger et bien dormir : c'est là que l'entraînement se transforme en progrès.",
    }
  }

  const { discipline, estimatedDurationMin: minutes } = session

  if (minutes < 60) {
    return {
      title: `Séance courte (${minutes} min)`,
      before: "Un repas habituel 2-3h avant suffit ; une petite collation si tu n'as rien mangé depuis longtemps.",
      during: "Pas besoin d'apport spécifique. Hydrate-toi normalement.",
      after: 'Un repas ou une collation équilibrée dans l’heure qui suit, sans urgence particulière.',
    }
  }

  if (minutes < 90) {
    return {
      title: `Séance moyenne (${minutes} min)`,
      before: "Repas riche en glucides, pauvre en graisses et en fibres, 2 à 3h avant l'effort.",
      during:
        'Hydratation régulière, avec électrolytes si forte chaleur ou grosse transpiration. Une collation légère (fruit, barre de céréales) si la séance est intense.',
      after:
        'Dans les 30 à 60 minutes qui suivent : glucides + protéines (environ 3 à 4 pour 1) pour lancer la récupération.',
    }
  }

  return {
    title: `Séance longue (${minutes} min)`,
    before: "Repas riche en glucides, pauvre en graisses et en fibres, 2 à 3h avant l'effort pour éviter les troubles digestifs.",
    during: longSessionDuringNote(discipline, weightKg),
    after:
      'Dans les 30 à 60 minutes qui suivent : glucides + protéines (environ 3 à 4 pour 1) — la fenêtre la plus efficace pour lancer la récupération.',
  }
}

export interface RaceDayGuidance {
  label: string
  strategy: string
}

export const RACE_DAY_GUIDANCE: Record<TriathlonDistance, RaceDayGuidance> = {
  sprint: {
    label: 'Sprint',
    strategy:
      "Une course Sprint dure le plus souvent 1h à 1h30 : un repas riche en glucides la veille au soir et un petit-déjeuner familier 2 à 3h avant le départ suffisent en général. Pendant la course, l'eau aux points de ravitaillement suffit le plus souvent ; un gel sur la partie course à pied peut aider en fin d'effort.",
  },
  olympic: {
    label: 'M (Olympique)',
    strategy:
      "Une distance M dure le plus souvent 2h30 à 3h30 : prévois de t'alimenter pendant le vélo, le moment le plus facile pour manger (30 à 60 g de glucides par heure). Teste toujours ta stratégie à l'entraînement avant la course — jamais un aliment ou un gel nouveau le jour J.",
  },
}

/**
 * Race-day fueling for running distances — grounded in the same widely-cited
 * sports-nutrition references as the plan generator itself (carb-loading
 * protocols popularized by Louise Burke's research, race-morning timing from
 * Daniels/Pfitzinger's marathon guidance). A 5K/10K rarely needs mid-race
 * fueling at all; the half and full marathon are where carb-loading and
 * in-race fueling actually change performance.
 */
export const RACE_DAY_GUIDANCE_RUNNING: Record<RunningDistance, RaceDayGuidance> = {
  '5k': {
    label: '5 km',
    strategy:
      "Un 5 km se court en 15 à 35 minutes : pas besoin de s'alimenter pendant la course. Un repas léger et riche en glucides 2 à 3h avant le départ, et de l'eau si tu as soif, suffisent largement. Pas de charge en glucides nécessaire pour cette distance.",
  },
  '10k': {
    label: '10 km',
    strategy:
      "Un 10 km dure le plus souvent 30 à 70 minutes : comme pour le 5 km, un repas riche en glucides 2 à 3h avant suffit et l'alimentation pendant la course reste inutile pour la grande majorité des coureurs. Concentre-toi plutôt sur une bonne hydratation la veille.",
  },
  'half-marathon': {
    label: 'Semi-marathon',
    strategy:
      "Le semi dure le plus souvent 1h30 à 2h30 : un petit-déjeuner familier et riche en glucides 2 à 3h avant le départ, puis 30 à 60 g de glucides par heure à partir de 45-60 minutes de course si l'effort dépasse 1h30 (gel ou boisson énergétique). Teste toujours ta stratégie à l'entraînement — jamais un produit nouveau le jour J.",
  },
  marathon: {
    label: 'Marathon',
    strategy:
      "Le marathon justifie une vraie charge en glucides les 2-3 jours précédents (rester actif mais augmenter la part de glucides dans l'alimentation) pour maximiser tes réserves de glycogène. Le jour J : petit-déjeuner familier 3h avant le départ, puis 60 à 90 g de glucides par heure pendant la course (gels, boisson énergétique, en alternant sources de glucides pour mieux les absorber) — c'est la distance où sous-fueling coûte le plus cher en fin de course (le fameux \"mur\"). Comme toujours, rien de nouveau le jour de la course.",
  },
}

/**
 * The one shared place that narrows a `RaceGoal` on `sport` to pick the
 * right race-day guidance table — mirrors `core/goals/raceGoalDisplay.ts`.
 */
export function getRaceDayGuidance(raceGoal: RaceGoal): RaceDayGuidance {
  return raceGoal.sport === 'triathlon'
    ? RACE_DAY_GUIDANCE[raceGoal.distance]
    : RACE_DAY_GUIDANCE_RUNNING[raceGoal.distance]
}

export const NUTRITION_PRINCIPLES: { title: string; body: string }[] = [
  {
    title: 'Hydratation',
    body: "Bois régulièrement tout au long de la journée, pas seulement pendant l'effort. Une urine claire est un bon indicateur d'hydratation correcte.",
  },
  {
    title: 'Glucides',
    body: "Ta principale source d'énergie à l'entraînement. Plus une séance est longue ou intense, plus la part de glucides dans ton alimentation autour de cette séance compte.",
  },
  {
    title: 'Protéines',
    body: "Réparties sur la journée, pas seulement juste après le sport, elles soutiennent la récupération musculaire — d'autant plus utile en période de charge d'entraînement élevée.",
  },
  {
    title: 'Rien de nouveau le jour J',
    body: "Ne teste jamais un aliment, un gel ou une boisson pour la première fois le jour d'une course ou d'une séance clé : teste-le d'abord à l'entraînement.",
  },
]

/** Kept as a function rather than a constant because the honest disclaimer
 * changes once a body weight is declared: the carb/fluid range is then a
 * real calculation from that number, not a duration-only guess — but it's
 * still general sports-nutrition guidance, not a full personalized plan. */
export function getNutritionDisclaimer(weightKnown: boolean): string {
  const weightClause = weightKnown
    ? 'les repères pendant l’effort ci-dessus sont calculés à partir de ton poids déclaré, pas une fourchette générique'
    : "l'app ne connaît pas ton poids, donc les repères pendant l'effort restent des fourchettes générales"
  return `Ces repères sont des principes généraux de nutrition sportive d'endurance, pas un plan personnalisé complet : ${weightClause}, et l'app ne connaît ni tes objectifs de composition corporelle ni d'éventuelles restrictions alimentaires. Pour un accompagnement adapté à ta situation, consulte un·e diététicien·ne du sport.`
}
