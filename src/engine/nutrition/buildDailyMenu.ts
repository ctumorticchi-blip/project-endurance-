import type { PlannedSession } from '@/core/training/PlannedSession'
import type {
  BudgetTier,
  DietaryRestriction,
  DietType,
  NutritionPreferences,
} from '@/core/nutrition/NutritionPreferences'
import {
  getMealsBySlot,
  type CostTier,
  type MacroFocus,
  type MealSlot,
  type MealTemplate,
} from '@/config/nutrition/mealCatalog'
import type { DateISO } from '@/shared/types/common'

export interface MenuEntry {
  slot: MealSlot
  meal: MealTemplate
  /** Present only when today's training context adds something to the
   * meal's own static rationale (e.g. carb-loading the night before a key
   * session, or a post-session recovery window) — appended to it, never
   * replacing it. */
  contextNote?: string
}

export interface DailyMenu {
  date: DateISO
  entries: MenuEntry[]
}

/** Below this duration (or outside 'key' priority), a session doesn't
 * warrant carb-loading the dinner before it or a dedicated recovery
 * snack after it — same 90-minute threshold `config/nutritionGuidance.ts`
 * already uses for "this session needs a fueling plan". */
const BIG_SESSION_MIN_DURATION = 90

function isBigSession(session: PlannedSession | undefined): boolean {
  if (!session) return false
  return session.priority === 'key' || session.estimatedDurationMin >= BIG_SESSION_MIN_DURATION
}

const COST_RANK: Record<CostTier, number> = { cheap: 0, moderate: 1, premium: 2 }

/** The highest cost tier a budget still comfortably absorbs. Never a hard
 * ceiling — see `pickMeal` — because letting a tight budget eliminate
 * every diet/allergen-safe option for a slot would be worse than
 * occasionally suggesting something a bit pricier than ideal. */
const BUDGET_MAX_COST: Record<BudgetTier, CostTier> = {
  tight: 'cheap',
  moderate: 'moderate',
  comfortable: 'premium',
  high: 'premium',
}

const RESTRICTION_FLAG: Record<DietaryRestriction, 'containsGluten' | 'containsLactose' | 'containsNuts'> = {
  'gluten-free': 'containsGluten',
  'lactose-free': 'containsLactose',
  'nut-free': 'containsNuts',
}

/** Diet type and declared allergies/intolerances are the only hard
 * constraints — they can make a meal ineligible with no fallback. Every
 * meal slot in the catalog has at least one vegan + gluten-free +
 * nut-free option (the strictest realistic combination), so this should
 * never legitimately return zero candidates — but the caller still
 * handles that possibility rather than assuming it can't happen. */
function isSafe(meal: MealTemplate, dietType: DietType, restrictions: DietaryRestriction[]): boolean {
  if (!meal.compatibleDiets.includes(dietType)) return false
  return restrictions.every((r) => !meal[RESTRICTION_FLAG[r]])
}

/** Small deterministic string hash — not cryptographic, just needs to
 * spread different (date, slot) seeds across the candidate list so the
 * same day always gets the same menu (reproducible, explicable) while
 * different days vary (brief: no mechanical repetition). */
function hashSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Every safety-compatible (diet + allergens) option for `slot` — the same
 * pool `pickMeal` draws from before macro-focus/budget narrow it further,
 * exposed so the athlete can see (and pick) any of them, not just the one
 * the engine would default to. Always includes the deterministic pick
 * itself, so "no other option" is visible as a list of one rather than an
 * empty, confusing list.
 */
export function getMealAlternatives(slot: MealSlot, preferences: NutritionPreferences): MealTemplate[] {
  return getMealsBySlot(slot).filter((m) => isSafe(m, preferences.dietType, preferences.restrictions))
}

/**
 * Picks one meal for `slot`. Safety (diet + allergies) is a hard filter
 * that never relaxes. `macroFocusPreference` comes next — it reflects an
 * actual physiological need tied to today's training (carb-loading before
 * a key session, recovery after one), so it's honored before budget: a
 * safe carb-loading dinner slightly over budget still beats an on-budget
 * dinner that ignores tomorrow's key session. Budget is the last, softest
 * preference — it narrows whatever's left when it can, but if nothing
 * left fits it, the pick still comes from the safe (and focus-matched)
 * set rather than returning nothing.
 */
export function pickMeal(
  slot: MealSlot,
  preferences: NutritionPreferences,
  seed: string,
  macroFocusPreference?: MacroFocus,
): MealTemplate | undefined {
  const safe = getMealsBySlot(slot).filter((m) => isSafe(m, preferences.dietType, preferences.restrictions))
  if (safe.length === 0) return undefined

  const focused = macroFocusPreference ? safe.filter((m) => m.macroFocus === macroFocusPreference) : []
  const focusPool = focused.length > 0 ? focused : safe

  const maxCostRank = COST_RANK[BUDGET_MAX_COST[preferences.budgetTier]]
  const withinBudget = focusPool.filter((m) => COST_RANK[m.costTier] <= maxCostRank)
  const pool = withinBudget.length > 0 ? withinBudget : focusPool

  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  return sorted[hashSeed(seed) % sorted.length]
}

export function buildDailyMenu(input: {
  date: DateISO
  session: PlannedSession | undefined
  nextSession: PlannedSession | undefined
  preferences: NutritionPreferences
}): DailyMenu {
  const { date, session, nextSession, preferences } = input
  const bigToday = isBigSession(session)
  const bigTomorrow = isBigSession(nextSession)

  const entries: MenuEntry[] = []

  const breakfast = pickMeal('breakfast', preferences, `${date}-breakfast`, bigToday ? 'carb-heavy' : undefined)
  if (breakfast) {
    entries.push({
      slot: 'breakfast',
      meal: breakfast,
      contextNote: bigToday ? "Séance importante aujourd'hui : un petit-déjeuner plus riche en glucides." : undefined,
    })
  }

  const lunch = pickMeal('lunch', preferences, `${date}-lunch`)
  if (lunch) entries.push({ slot: 'lunch', meal: lunch })

  let dinnerFocus: MacroFocus | undefined
  let dinnerNote: string | undefined
  if (bigTomorrow) {
    dinnerFocus = 'carb-heavy'
    dinnerNote = "Charge glucidique ce soir : tu as une séance importante demain."
  } else if (bigToday) {
    dinnerFocus = 'protein-recovery'
    dinnerNote = "Pour soutenir la récupération après ta séance d'aujourd'hui."
  }
  const dinner = pickMeal('dinner', preferences, `${date}-dinner`, dinnerFocus)
  if (dinner) entries.push({ slot: 'dinner', meal: dinner, contextNote: dinnerNote })

  if (bigToday) {
    const snack = pickMeal('snack', preferences, `${date}-snack`, 'protein-recovery')
    if (snack) {
      entries.push({
        slot: 'snack',
        meal: snack,
        contextNote: 'Dans les 30 à 60 minutes après ta séance, pour lancer la récupération.',
      })
    }
  }

  return { date, entries }
}
