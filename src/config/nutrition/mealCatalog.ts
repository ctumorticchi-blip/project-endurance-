import type { DietType } from '@/core/nutrition/NutritionPreferences'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** What this meal is *for*, nutritionally — drives which meal gets picked
 * on which day (see `engine/nutrition/buildDailyMenu.ts`), never shown as
 * a raw label to the athlete (the rationale text says the same thing in
 * plain language). */
export type MacroFocus = 'carb-heavy' | 'protein-recovery' | 'balanced' | 'light'

/** A relative price band, not a currency amount — deliberately coarse
 * (brief "pas de fausse précision" applies to nutrition too): real grocery
 * prices vary by region, season and store, so a table of estimated euro
 * amounts would be a fake precision. `cheap` favors staples (legumes,
 * eggs, pasta, seasonal veg, canned fish); `premium` allows salmon, fresh
 * fish, specialty items. */
export type CostTier = 'cheap' | 'moderate' | 'premium'

export interface MealItem {
  food: string
  portion: string
}

export interface MealTemplate {
  id: string
  slot: MealSlot
  title: string
  items: MealItem[]
  /** The "why" — what this meal is doing for the athlete's training, not
   * a generic health claim (brief: explicabilité). */
  rationale: string
  macroFocus: MacroFocus
  costTier: CostTier
  /** Diets that can safely eat this meal as-is. A vegan meal lists every
   * diet (it's the strictest), a meat dish lists only 'omnivore'. */
  compatibleDiets: DietType[]
  containsGluten: boolean
  containsLactose: boolean
  containsNuts: boolean
}

const ALL_DIETS: DietType[] = ['omnivore', 'vegetarian', 'vegan', 'pescetarian']
const FISH_OK: DietType[] = ['pescetarian', 'omnivore']
const MEAT_ONLY: DietType[] = ['omnivore']
const VEGETARIAN_OK: DietType[] = ['vegetarian', 'pescetarian', 'omnivore']
const VEGAN_OK: DietType[] = ALL_DIETS

export const BREAKFASTS: MealTemplate[] = [
  {
    id: 'breakfast-porridge-banane',
    slot: 'breakfast',
    title: "Porridge avoine, banane, cannelle",
    items: [
      { food: "Flocons d'avoine", portion: '70 g' },
      { food: 'Boisson végétale (avoine, soja...)', portion: '250 ml' },
      { food: 'Banane', portion: '1' },
      { food: 'Cannelle', portion: 'une pincée' },
    ],
    rationale:
      "Glucides complexes à libération lente pour tenir jusqu'à la séance ou le déjeuner, banane pour le potassium.",
    macroFocus: 'carb-heavy',
    costTier: 'cheap',
    compatibleDiets: VEGAN_OK,
    containsGluten: true,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'breakfast-yaourt-riz-souffle',
    slot: 'breakfast',
    title: 'Yaourt, riz soufflé, fruits rouges',
    items: [
      { food: 'Yaourt nature', portion: '2 (250 g)' },
      { food: 'Riz soufflé nature', portion: '40 g' },
      { food: 'Fruits rouges (frais ou surgelés)', portion: '100 g' },
      { food: 'Miel', portion: '1 cuillère à café' },
    ],
    rationale: 'Protéines du yaourt pour la satiété, antioxydants des fruits rouges, sans gluten.',
    macroFocus: 'balanced',
    costTier: 'cheap',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: false,
    containsLactose: true,
    containsNuts: false,
  },
  {
    id: 'breakfast-tartines-fromage-frais',
    slot: 'breakfast',
    title: 'Tartines pain complet, fromage frais, banane',
    items: [
      { food: 'Pain complet', portion: '3 tranches' },
      { food: 'Fromage frais (type petit-suisse ou St Môret)', portion: '60 g' },
      { food: 'Banane', portion: '1' },
    ],
    rationale: 'Un classique simple et peu coûteux : glucides + un peu de protéines/matières grasses.',
    macroFocus: 'balanced',
    costTier: 'moderate',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: true,
    containsLactose: true,
    containsNuts: false,
  },
  {
    id: 'breakfast-quinoa-souffle-amandes',
    slot: 'breakfast',
    title: 'Bol quinoa soufflé, boisson amande, fruits secs',
    items: [
      { food: 'Quinoa soufflé', portion: '50 g' },
      { food: "Boisson à l'amande", portion: '250 ml' },
      { food: "Fruits secs (abricots, raisins)", portion: '20 g' },
      { food: 'Amandes effilées', portion: '10 g' },
    ],
    rationale: 'Alternative sans gluten, bonnes graisses des amandes pour un petit-déjeuner plus rassasiant.',
    macroFocus: 'balanced',
    costTier: 'moderate',
    compatibleDiets: VEGAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: true,
  },
  {
    id: 'breakfast-oeufs-tartines',
    slot: 'breakfast',
    title: 'Œufs brouillés, pain complet, tomates',
    items: [
      { food: 'Œufs', portion: '2' },
      { food: 'Pain complet', portion: '2 tranches' },
      { food: 'Tomates', portion: '1' },
    ],
    rationale: 'Petit-déjeuner riche en protéines pour une matinée avec une séance de qualité.',
    macroFocus: 'protein-recovery',
    costTier: 'cheap',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: true,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'breakfast-smoothie-bowl',
    slot: 'breakfast',
    title: 'Smoothie bowl fruits rouges, graines de chia, riz soufflé',
    items: [
      { food: 'Fruits rouges surgelés', portion: '150 g' },
      { food: 'Banane', portion: '1/2' },
      { food: 'Graines de chia', portion: '1 cuillère à soupe' },
      { food: 'Riz soufflé nature', portion: '30 g' },
    ],
    rationale: 'Sans gluten, sans lactose, sans fruits à coque — une option légère avant une sortie facile.',
    macroFocus: 'light',
    costTier: 'premium',
    compatibleDiets: VEGAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
]

export const LUNCHES: MealTemplate[] = [
  {
    id: 'lunch-pates-thon',
    slot: 'lunch',
    title: 'Pâtes complètes, sauce tomate, thon',
    items: [
      { food: 'Pâtes complètes (poids cru)', portion: '90 g' },
      { food: 'Sauce tomate', portion: '150 g' },
      { food: 'Thon au naturel (boîte)', portion: '1 (140 g)' },
      { food: "Huile d'olive", portion: '1 cuillère à soupe' },
    ],
    rationale: 'Base glucidique généreuse et peu chère, protéines du thon.',
    macroFocus: 'balanced',
    costTier: 'cheap',
    compatibleDiets: FISH_OK,
    containsGluten: true,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'lunch-pates-poulet-parmesan',
    slot: 'lunch',
    title: 'Pâtes, poulet, légumes, parmesan',
    items: [
      { food: 'Pâtes (poids cru)', portion: '90 g' },
      { food: 'Blanc de poulet', portion: '120 g' },
      { food: 'Légumes sautés (courgette, poivron)', portion: '150 g' },
      { food: 'Parmesan râpé', portion: '15 g' },
    ],
    rationale: 'Bon équilibre glucides/protéines pour une séance de qualité en fin de journée.',
    macroFocus: 'balanced',
    costTier: 'moderate',
    compatibleDiets: MEAT_ONLY,
    containsGluten: true,
    containsLactose: true,
    containsNuts: false,
  },
  {
    id: 'lunch-riz-lentilles',
    slot: 'lunch',
    title: 'Riz complet, lentilles corail, légumes, curcuma',
    items: [
      { food: 'Riz complet (poids cru)', portion: '80 g' },
      { food: 'Lentilles corail (poids cru)', portion: '60 g' },
      { food: 'Légumes (carottes, épinards)', portion: '150 g' },
      { food: 'Curcuma, cumin', portion: 'au goût' },
    ],
    rationale:
      'Protéines végétales des lentilles + glucides du riz, sans gluten ni lactose, l\'un des repas les moins chers du catalogue.',
    macroFocus: 'balanced',
    costTier: 'cheap',
    compatibleDiets: VEGAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'lunch-bowl-quinoa-pois-chiches',
    slot: 'lunch',
    title: 'Bowl quinoa, pois chiches, avocat, amandes effilées',
    items: [
      { food: 'Quinoa (poids cru)', portion: '70 g' },
      { food: 'Pois chiches (égouttés)', portion: '150 g' },
      { food: 'Avocat', portion: '1/2' },
      { food: 'Amandes effilées', portion: '10 g' },
    ],
    rationale: 'Bonnes graisses de l\'avocat, protéines végétales, sans gluten ni lactose.',
    macroFocus: 'balanced',
    costTier: 'moderate',
    compatibleDiets: VEGAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: true,
  },
  {
    id: 'lunch-wrap-poulet',
    slot: 'lunch',
    title: 'Wrap galette blé complet, poulet, crudités',
    items: [
      { food: 'Galette de blé complet', portion: '2' },
      { food: 'Blanc de poulet', portion: '120 g' },
      { food: 'Crudités (salade, tomate, carotte râpée)', portion: '100 g' },
      { food: 'Sauce yaourt légère', portion: '1 cuillère à soupe' },
    ],
    rationale: 'Pratique à emporter avant/après une séance en milieu de journée.',
    macroFocus: 'protein-recovery',
    costTier: 'moderate',
    compatibleDiets: MEAT_ONLY,
    containsGluten: true,
    containsLactose: true,
    containsNuts: false,
  },
  {
    id: 'lunch-saumon-riz-brocolis',
    slot: 'lunch',
    title: 'Saumon grillé, riz, brocolis',
    items: [
      { food: 'Pavé de saumon', portion: '130 g' },
      { food: 'Riz basmati (poids cru)', portion: '80 g' },
      { food: 'Brocolis', portion: '150 g' },
    ],
    rationale: "Oméga-3 du saumon, glucides du riz — un repas plus généreux si le budget le permet.",
    macroFocus: 'balanced',
    costTier: 'premium',
    compatibleDiets: FISH_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
]

export const DINNERS: MealTemplate[] = [
  {
    id: 'dinner-pates-legumes',
    slot: 'dinner',
    title: "Pâtes complètes, légumes, sauce tomate, huile d'olive",
    items: [
      { food: 'Pâtes complètes (poids cru)', portion: '100 g' },
      { food: 'Légumes (courgette, poivron, oignon)', portion: '150 g' },
      { food: 'Sauce tomate', portion: '150 g' },
      { food: "Huile d'olive", portion: '1 cuillère à soupe' },
    ],
    rationale:
      'Charge glucidique généreuse et digeste — le repas classique la veille d\'une sortie longue ou d\'une séance clé.',
    macroFocus: 'carb-heavy',
    costTier: 'cheap',
    compatibleDiets: VEGAN_OK,
    containsGluten: true,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'dinner-poisson-riz-courgettes',
    slot: 'dinner',
    title: 'Riz, poisson blanc, courgettes vapeur',
    items: [
      { food: 'Riz (poids cru)', portion: '80 g' },
      { food: 'Filet de poisson blanc (cabillaud, colin)', portion: '150 g' },
      { food: 'Courgettes vapeur', portion: '150 g' },
    ],
    rationale: 'Léger et digeste, sans gluten ni lactose — un bon dîner un soir de repos ou de séance facile.',
    macroFocus: 'light',
    costTier: 'moderate',
    compatibleDiets: FISH_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'dinner-oeufs-pdt-salade',
    slot: 'dinner',
    title: 'Œufs, pommes de terre vapeur, salade verte',
    items: [
      { food: 'Œufs', portion: '2' },
      { food: 'Pommes de terre', portion: '250 g' },
      { food: 'Salade verte', portion: '100 g' },
      { food: "Vinaigrette (huile d'olive, vinaigre)", portion: '1 cuillère à soupe' },
    ],
    rationale: 'Simple, peu coûteux, protéines des œufs + glucides des pommes de terre.',
    macroFocus: 'balanced',
    costTier: 'cheap',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'dinner-gratin-pates-legumes',
    slot: 'dinner',
    title: 'Gratin de pâtes, légumes, fromage',
    items: [
      { food: 'Pâtes (poids cru)', portion: '90 g' },
      { food: 'Légumes (épinards, champignons)', portion: '150 g' },
      { food: 'Fromage râpé', portion: '30 g' },
      { food: 'Béchamel légère', portion: '100 g' },
    ],
    rationale: 'Réconfortant et calorique — utile en semaine de gros volume d\'entraînement.',
    macroFocus: 'carb-heavy',
    costTier: 'moderate',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: true,
    containsLactose: true,
    containsNuts: false,
  },
  {
    id: 'dinner-veloute-oeuf-quinoa',
    slot: 'dinner',
    title: 'Velouté de légumes, œuf poché, quinoa',
    items: [
      { food: 'Velouté de légumes (maison ou du commerce)', portion: '350 ml' },
      { food: 'Œuf poché', portion: '1' },
      { food: 'Quinoa (poids cru)', portion: '40 g' },
    ],
    rationale: 'Dîner léger et facile à digérer, sans gluten ni lactose — bien avant une nuit de récupération.',
    macroFocus: 'light',
    costTier: 'cheap',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'dinner-poulet-patate-douce',
    slot: 'dinner',
    title: 'Poulet grillé, patate douce, haricots verts',
    items: [
      { food: 'Blanc de poulet', portion: '150 g' },
      { food: 'Patate douce', portion: '200 g' },
      { food: 'Haricots verts', portion: '150 g' },
    ],
    rationale: 'Bon équilibre protéines/glucides pour la récupération après une séance clé.',
    macroFocus: 'protein-recovery',
    costTier: 'premium',
    compatibleDiets: MEAT_ONLY,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'dinner-tofu-riz-legumes',
    slot: 'dinner',
    title: 'Tofu sauté, riz complet, légumes',
    items: [
      { food: 'Tofu ferme', portion: '150 g' },
      { food: 'Riz complet (poids cru)', portion: '80 g' },
      { food: 'Légumes sautés (brocolis, carottes, poivron)', portion: '200 g' },
      { food: 'Sauce soja', portion: '1 cuillère à soupe' },
    ],
    rationale:
      "Protéines végétales du tofu + glucides complets, sans gluten (avec une sauce soja sans blé), sans lactose ni fruits à coque.",
    macroFocus: 'balanced',
    costTier: 'moderate',
    compatibleDiets: VEGAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
]

export const SNACKS: MealTemplate[] = [
  {
    id: 'snack-yaourt-banane-miel',
    slot: 'snack',
    title: 'Yaourt, banane, miel',
    items: [
      { food: 'Yaourt nature', portion: '1 (125 g)' },
      { food: 'Banane', portion: '1' },
      { food: 'Miel', portion: '1 cuillère à café' },
    ],
    rationale:
      'Glucides + protéines dans la fenêtre des 30 à 60 minutes après une séance clé, pour lancer la récupération.',
    macroFocus: 'protein-recovery',
    costTier: 'cheap',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: false,
    containsLactose: true,
    containsNuts: false,
  },
  {
    id: 'snack-compote-galette-riz',
    slot: 'snack',
    title: 'Compote de fruits, galette de riz',
    items: [
      { food: 'Compote sans sucre ajouté', portion: '1 (100 g)' },
      { food: 'Galette de riz', portion: '2' },
    ],
    rationale: 'Collation légère et rapide à digérer, sans gluten, sans lactose, sans fruits à coque.',
    macroFocus: 'light',
    costTier: 'cheap',
    compatibleDiets: VEGAN_OK,
    containsGluten: false,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'snack-fromage-blanc-fruits-secs',
    slot: 'snack',
    title: 'Fromage blanc, fruits secs et oléagineux, miel',
    items: [
      { food: 'Fromage blanc', portion: '150 g' },
      { food: 'Fruits secs et amandes', portion: '20 g' },
      { food: 'Miel', portion: '1 cuillère à café' },
    ],
    rationale: 'Riche en protéines pour la récupération, énergie dense des fruits secs.',
    macroFocus: 'protein-recovery',
    costTier: 'moderate',
    compatibleDiets: VEGETARIAN_OK,
    containsGluten: false,
    containsLactose: true,
    containsNuts: true,
  },
  {
    id: 'snack-banane-pain-confiture',
    slot: 'snack',
    title: 'Banane, tranche de pain, confiture',
    items: [
      { food: 'Banane', portion: '1' },
      { food: 'Pain', portion: '1 tranche' },
      { food: 'Confiture', portion: '1 cuillère à café' },
    ],
    rationale: 'Un petit apport de glucides rapides avant une séance, simple et peu coûteux.',
    macroFocus: 'carb-heavy',
    costTier: 'cheap',
    compatibleDiets: VEGAN_OK,
    containsGluten: true,
    containsLactose: false,
    containsNuts: false,
  },
  {
    id: 'snack-smoothie-avoine-soja',
    slot: 'snack',
    title: 'Smoothie banane, boisson de soja, flocons d\'avoine',
    items: [
      { food: 'Banane', portion: '1' },
      { food: 'Boisson de soja', portion: '200 ml' },
      { food: "Flocons d'avoine", portion: '30 g' },
    ],
    rationale: 'Protéines du soja + glucides de l\'avoine, une alternative végane à la collation de récupération.',
    macroFocus: 'protein-recovery',
    costTier: 'moderate',
    compatibleDiets: VEGAN_OK,
    containsGluten: true,
    containsLactose: false,
    containsNuts: false,
  },
]

export const MEAL_CATALOG: MealTemplate[] = [...BREAKFASTS, ...LUNCHES, ...DINNERS, ...SNACKS]

const BY_SLOT: Record<MealSlot, MealTemplate[]> = {
  breakfast: BREAKFASTS,
  lunch: LUNCHES,
  dinner: DINNERS,
  snack: SNACKS,
}

export function getMealsBySlot(slot: MealSlot): MealTemplate[] {
  return BY_SLOT[slot]
}

export function getMealById(id: string): MealTemplate | undefined {
  return MEAL_CATALOG.find((m) => m.id === id)
}
