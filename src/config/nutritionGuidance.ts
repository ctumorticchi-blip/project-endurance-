import type { TriathlonDistance } from '@/sports/triathlon/domain/distance'
import type { Discipline } from '@/shared/types/common'

export interface FuelingGuidance {
  title: string
  before: string
  during: string
  after: string
}

/**
 * General endurance-sports fueling guidance, bucketed by session duration
 * — the dominant factor — with a per-discipline note only where it
 * actually changes the advice (swim: fueling during the effort is
 * impractical). The ranges here (e.g. ~30-60g carbs/hour beyond 90min)
 * are widely-cited public sports-nutrition guidance, not a personalized
 * prescription: the app has no body-weight, composition, or dietary data
 * to compute one from (brief: no false precision — a range grounded in
 * duration is honest, a fabricated per-kg number would not be).
 */
export function getFuelingGuidance(
  session: { discipline: Discipline; estimatedDurationMin: number } | undefined,
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

  const duringNote =
    discipline === 'swim'
      ? "En natation, difficile de s'alimenter pendant l'effort : mise plutôt sur un bon apport avant et juste après."
      : '30 à 60 g de glucides par heure (gels, barres, boisson énergétique) et 500 à 750 ml d’eau par heure, à ajuster selon ta transpiration.'

  return {
    title: `Séance longue (${minutes} min)`,
    before: "Repas riche en glucides, pauvre en graisses et en fibres, 2 à 3h avant l'effort pour éviter les troubles digestifs.",
    during: duringNote,
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

export const NUTRITION_DISCLAIMER =
  "Ces repères sont des principes généraux de nutrition sportive d'endurance, pas un plan personnalisé : l'app ne connaît ni ton poids, ni tes objectifs de composition corporelle, ni d'éventuelles restrictions alimentaires. Pour un accompagnement adapté à ta situation, consulte un·e diététicien·ne du sport."
