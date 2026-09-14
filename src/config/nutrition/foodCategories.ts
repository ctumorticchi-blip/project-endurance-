/**
 * Grocery-aisle categories for the shopping list (`engine/nutrition/buildShoppingList.ts`)
 * — the same grouping a dietitian (or the supermarket itself) would use,
 * so the list can be worked through aisle by aisle instead of as one flat
 * alphabetical dump.
 */
export type GroceryCategory =
  | 'produce'
  | 'starches'
  | 'protein'
  | 'dairy'
  | 'pantry'

export const GROCERY_CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: 'Fruits & légumes',
  starches: 'Féculents & céréales',
  protein: 'Protéines',
  dairy: 'Produits laitiers & alternatives',
  pantry: 'Épicerie, condiments & snacks',
}

/** Display order — produce and proteins first (the aisles usually walked
 * first / most perishable), pantry last. */
export const GROCERY_CATEGORY_ORDER: GroceryCategory[] = ['produce', 'protein', 'dairy', 'starches', 'pantry']

/**
 * Every distinct `food` string used anywhere in `config/nutrition/mealCatalog.ts`,
 * mapped by hand to its aisle — verified exhaustive by
 * `foodCategories.test.ts` (fails the build if a new catalog item is added
 * without a category, rather than silently falling back to "pantry").
 * Matched by exact string, deliberately: "Œuf" and "Œuf dur" are kept
 * distinct rather than fuzzy-merged, since guessing that two differently
 * worded items are "the same thing" is exactly the kind of invented
 * precision this app avoids elsewhere.
 */
export const FOOD_CATEGORIES: Record<string, GroceryCategory> = {
  // Fruits & légumes
  Avocat: 'produce',
  Banane: 'produce',
  Brocolis: 'produce',
  'Bâtonnets de carotte, concombre': 'produce',
  'Compote de pommes sans sucre ajouté': 'produce',
  'Compote sans sucre ajouté': 'produce',
  'Courgettes vapeur': 'produce',
  'Crudités (salade, tomate)': 'produce',
  'Crudités (salade, tomate, carotte râpée)': 'produce',
  'Crudités (salade, tomate, concombre)': 'produce',
  'Fruit de saison': 'produce',
  'Fruits frais de saison': 'produce',
  'Fruits rouges (frais ou surgelés)': 'produce',
  'Fruits rouges surgelés': 'produce',
  'Fruits rouges': 'produce',
  'Haricots verts': 'produce',
  'Légumes (carottes, épinards)': 'produce',
  'Légumes (courgette, carotte)': 'produce',
  'Légumes (courgette, poivron, oignon)': 'produce',
  'Légumes (courgette, épinards, tomates)': 'produce',
  'Légumes (poivron, brocolis)': 'produce',
  'Légumes (poivron, champignons, oignon)': 'produce',
  'Légumes (épinards, champignons)': 'produce',
  'Légumes de couscous (carottes, courgettes, navets)': 'produce',
  'Légumes rôtis (courgette, poivron, aubergine)': 'produce',
  'Légumes sautés (brocolis, carottes)': 'produce',
  'Légumes sautés (brocolis, carottes, poivron)': 'produce',
  'Légumes sautés (courgette, poivron)': 'produce',
  'Légumes sautés (poivron, oignon, champignons)': 'produce',
  'Légumes sautés (poivron, pois gourmands)': 'produce',
  'Légumes vapeur': 'produce',
  'Patate douce': 'produce',
  Pomme: 'produce',
  'Pommes de terre vapeur': 'produce',
  'Pommes de terre': 'produce',
  'Salade verte': 'produce',
  'Salade verte, tomates': 'produce',
  'Soupe de légumes maison': 'produce',
  Tomates: 'produce',
  'Velouté de légumes (maison ou du commerce)': 'produce',
  Épinards: 'produce',

  // Féculents & céréales
  'Crackers complets': 'starches',
  'Flocons de sarrasin': 'starches',
  "Flocons d'avoine mixés": 'starches',
  "Flocons d'avoine": 'starches',
  "Flocons d'avoine, graines de tournesol": 'starches',
  'Galette de blé complet': 'starches',
  'Galette de riz': 'starches',
  'Granola maison': 'starches',
  'Muesli maison': 'starches',
  'Pain complet': 'starches',
  'Pain pitta complet': 'starches',
  'Pain rassis': 'starches',
  Pain: 'starches',
  'Pâtes (poids cru)': 'starches',
  'Pâtes complètes (poids cru)': 'starches',
  'Quinoa (poids cru)': 'starches',
  'Quinoa soufflé': 'starches',
  'Riz (poids cru)': 'starches',
  'Riz basmati (poids cru)': 'starches',
  'Riz complet (poids cru)': 'starches',
  'Riz rond (poids cru)': 'starches',
  'Riz soufflé nature': 'starches',
  'Semoule complète (poids cru)': 'starches',

  // Protéines
  'Blanc de poulet': 'protein',
  'Bœuf haché 5% MG': 'protein',
  Crevettes: 'protein',
  Edamame: 'protein',
  Falafels: 'protein',
  'Filet de maquereau': 'protein',
  'Filet de poisson blanc (cabillaud, colin)': 'protein',
  'Jambon blanc': 'protein',
  'Lentilles corail (poids cru)': 'protein',
  'Lentilles vertes (cuites)': 'protein',
  'Pavé de saumon': 'protein',
  'Pois chiches (égouttés)': 'protein',
  'Saumon cru ou cuit': 'protein',
  'Thon au naturel (boîte)': 'protein',
  'Thon au naturel': 'protein',
  'Tofu ferme': 'protein',
  'Œuf dur': 'protein',
  'Œuf poché': 'protein',
  Œuf: 'protein',
  Œufs: 'protein',

  // Produits laitiers & alternatives
  "Boisson à l'amande": 'dairy',
  'Boisson de soja chocolatée': 'dairy',
  'Boisson de soja': 'dairy',
  'Boisson végétale (avoine, soja...)': 'dairy',
  'Boisson végétale': 'dairy',
  Feta: 'dairy',
  'Fromage blanc': 'dairy',
  'Fromage frais (type petit-suisse ou St Môret)': 'dairy',
  'Fromage râpé': 'dairy',
  Fromage: 'dairy',
  Lait: 'dairy',
  'Parmesan râpé': 'dairy',
  'Sauce yaourt légère': 'dairy',
  'Skyr ou fromage blanc 0%': 'dairy',
  'Yaourt nature': 'dairy',

  // Épicerie, condiments & snacks
  'Amandes effilées': 'pantry',
  Amandes: 'pantry',
  'Barre maison avoine-miel-banane': 'pantry',
  'Beurre de cacahuète': 'pantry',
  'Béchamel légère': 'pantry',
  Cannelle: 'pantry',
  Confiture: 'pantry',
  'Curcuma, cumin': 'pantry',
  Dattes: 'pantry',
  'Fruits secs et amandes': 'pantry',
  'Fruits secs mélangés (sans oléagineux)': 'pantry',
  'Fruits secs (abricots, raisins)': 'pantry',
  'Graines de chia': 'pantry',
  Houmous: 'pantry',
  "Huile d'olive": 'pantry',
  'Lait de coco': 'pantry',
  Miel: 'pantry',
  'Raisins secs': 'pantry',
  'Sauce soja': 'pantry',
  'Sauce tomate': 'pantry',
  "Sirop d'érable": 'pantry',
  'Soupe miso (pâte miso sans blé)': 'pantry',
  'Vinaigrette (huile d\'olive, vinaigre)': 'pantry',
  'Épices (cumin, ras-el-hanout)': 'pantry',
}

/** Falls back to `pantry` for anything not yet mapped — defensive only,
 * `foodCategories.test.ts` fails the suite before this would ever fire. */
export function getFoodCategory(food: string): GroceryCategory {
  return FOOD_CATEGORIES[food] ?? 'pantry'
}
