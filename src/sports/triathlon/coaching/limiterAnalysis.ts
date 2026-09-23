import type { AthleteProfile } from '@/core/athlete/AthleteProfile'
import type { Level } from '@/shared/types/common'

type TriathlonDiscipline = 'swim' | 'bike' | 'run'

/** Coarse numeric ranking of the existing `Level` enum — never exposed as a
 * score to the athlete (brief "pas de fausse précision"), used only to
 * compare disciplines against each other deterministically. PRODUCT_RULE. */
const LEVEL_RANK: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 3 }

/**
 * Deterministic tie-break order when two disciplines share the same
 * declared level. COACHING_HEURISTIC: swim is called out first because a
 * technical deficiency in swim is the most common real-world triathlon
 * limiter and has the highest return on targeted technical work (brief
 * §19); run is favored last as the strongest to protect it from being
 * silently deprioritized, since over-reducing running volume is the
 * fastest way to lose fitness in that discipline.
 */
const LIMITER_TIE_BREAK: TriathlonDiscipline[] = ['swim', 'bike', 'run']
const STRENGTH_TIE_BREAK: TriathlonDiscipline[] = ['run', 'bike', 'swim']

export interface DisciplineStrengthAnalysis {
  levels: Record<TriathlonDiscipline, Level>
  /** The discipline needing the most development relative to the others. */
  limiter: TriathlonDiscipline
  /** The discipline that can be maintained with proportionally less time. */
  strongest: TriathlonDiscipline
  /** True when all three disciplines share the same declared level — no
   * discipline is meaningfully behind the others. */
  isBalanced: boolean
  /** Whether a discipline-specific tested metric is known (FTP/CSS/threshold
   * pace) — a soft confidence signal that training in that discipline has
   * been serious/consistent enough to test, not itself a level. */
  hasTestedMetric: Record<TriathlonDiscipline, boolean>
  /** Athlete-facing "why this week allocates development time the way it does". */
  explanation: string
}

function pickExtreme(
  levels: Record<TriathlonDiscipline, Level>,
  compare: (a: number, b: number) => boolean,
  tieBreak: TriathlonDiscipline[],
): TriathlonDiscipline {
  let best = tieBreak[0]!
  for (const discipline of tieBreak) {
    if (compare(LEVEL_RANK[levels[discipline]], LEVEL_RANK[levels[best]])) {
      best = discipline
    }
  }
  return best
}

/**
 * Compares an athlete's three discipline levels against each other — the
 * "Limiter / Strength Analysis" pipeline step (brief §3, §4). Declared
 * levels are the primary signal (always present, since triathlon onboarding
 * asks all three — `sports/triathlon` never partially onboards); a known
 * tested metric per discipline is used only as an explanatory confidence
 * note, never to override the declared level itself (no fabricated
 * precision from a single test).
 */
export function analyzeLimiters(profile: AthleteProfile): DisciplineStrengthAnalysis {
  const levels: Record<TriathlonDiscipline, Level> = {
    swim: profile.disciplineLevels.swim ?? 'beginner',
    bike: profile.disciplineLevels.bike ?? 'beginner',
    run: profile.disciplineLevels.run,
  }

  const limiter = pickExtreme(levels, (a, b) => a < b, LIMITER_TIE_BREAK)
  const strongest = pickExtreme(levels, (a, b) => a > b, STRENGTH_TIE_BREAK)
  const isBalanced = levels.swim === levels.bike && levels.bike === levels.run

  const hasTestedMetric: Record<TriathlonDiscipline, boolean> = {
    swim: profile.knownMetrics.cssSecPer100m !== undefined,
    bike: profile.knownMetrics.ftpWatts !== undefined,
    run: profile.knownMetrics.thresholdPaceSecPerKm !== undefined,
  }

  const DISCIPLINE_LABEL: Record<TriathlonDiscipline, string> = { swim: 'natation', bike: 'vélo', run: 'course' }
  const explanation = isBalanced
    ? "Tes trois disciplines sont à un niveau comparable : le programme développe les trois de façon équilibrée."
    : `Ta ${DISCIPLINE_LABEL[strongest]} est déjà ton point fort par rapport à ta ${DISCIPLINE_LABEL[limiter]} : ce bloc alloue davantage de travail de développement à la ${DISCIPLINE_LABEL[limiter]} tout en maintenant ta ${DISCIPLINE_LABEL[strongest]} sans lui consacrer un temps disproportionné.`

  return { levels, limiter, strongest, isBalanced, hasTestedMetric, explanation }
}
