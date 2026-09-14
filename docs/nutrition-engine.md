# Nutrition Engine

Ce document décrit la génération de menus quotidiens (`core/nutrition`,
`config/nutrition`, `engine/nutrition`, `features/nutrition`). Pour les
repères généraux (fenêtres avant/pendant/après, stratégie jour de course),
voir `config/nutritionGuidance.ts` — ce module est complémentaire, pas un
remplacement.

## Principe : déterministe, jamais un LLM

Comme le moteur d'entraînement (`docs/training-philosophy.md`), les menus
ne sont **jamais générés par un LLM** à la volée — on ne demande pas à un
modèle de langage « propose-moi un repas », qui produirait une réponse non
reproductible et impossible à garantir sûre. Le moteur choisit parmi un
**catalogue de repas authorés** (`config/nutrition/mealCatalog.ts`), de la
même manière que le catalogue de séances d'entraînement : chaque repas est
un contenu fixe, inspectable, avec ses aliments, ses portions, sa
justification ("pourquoi ce repas") et ses tags (régime compatible,
allergènes, coût). Le moteur ne fait que sélectionner, jamais halluciner.

## Préférences (`core/nutrition/NutritionPreferences.ts`)

Demandées de façon **interactive directement dans l'onglet Nutrition**
(pas noyées dans l'onboarding principal) :

- **Régime** : omnivore / végétarien / végan / pescétarien.
- **Restrictions** : sans gluten / sans lactose / sans fruits à coque
  (à cocher, plusieurs possibles).
- **Budget hebdomadaire** : serré / modéré / confortable / large — une
  bande relative, jamais un montant en euros précis calculé (les prix
  réels varient trop selon la région/saison/magasin pour être honnêtes ici
  — brief « pas de fausse précision »).

Modifiables à tout moment via « Modifier mes préférences ». Effacées avec
le reste du profil lors d'une réinitialisation.

## Sélection d'un repas (`engine/nutrition/buildDailyMenu.ts`)

Pour chaque créneau (petit-déjeuner, déjeuner, dîner, et collation quand
elle a lieu), la sélection applique trois niveaux de contrainte, **dans
cet ordre de priorité** :

1. **Sécurité (régime + allergènes) — jamais assouplie.** Un repas
   incompatible avec le régime déclaré ou contenant un allergène exclu
   n'est jamais proposé, quel que soit le budget ou le contexte du jour.
   Le catalogue garantit qu'il existe toujours, pour chaque créneau, au
   moins une option végane + sans gluten + sans fruits à coque (la
   combinaison la plus stricte réaliste) — testé
   (`config/nutrition/mealCatalog.test.ts`).
2. **Contexte d'entraînement du jour.** Si la séance du jour est une
   séance clé ou dure ≥ 90 min, le petit-déjeuner et une collation de
   récupération sont orientés en conséquence. Si la séance de **demain**
   est clé/longue, le dîner de ce soir devient une charge glucidique — et
   ce besoin prime sur le budget : un dîner de charge glucidique
   légèrement au-dessus du budget habituel reste préférable à un dîner
   dans le budget qui ignore la séance importante du lendemain.
3. **Budget — la préférence la plus souple.** Une fois la sécurité et le
   contexte du jour respectés, le moteur préfère un repas dans la bande de
   coût déclarée. S'il n'en reste aucun après les deux filtres précédents,
   le choix se fait quand même parmi les options sûres restantes plutôt
   que de ne rien proposer.

La rotation entre plusieurs repas compatibles pour un même créneau est
**déterministe** (petit hash de la date + créneau, pas de hasard) : le
menu d'une journée donnée reste identique si on recharge la page, mais
varie d'un jour à l'autre pour éviter de répéter mécaniquement le même
repas. Le catalogue compte une soixantaine de repas (environ 16 par
créneau) couvrant des cuisines et sources de protéines variées — sur un
programme complet de plusieurs mois, la quasi-totalité des repas
compatibles avec un régime donné finit par apparaître (vérifié : ~15
petits-déjeuners/déjeuners/dîners distincts sur une fenêtre de 90 jours).

## Liste de courses (`engine/nutrition/buildShoppingList.ts`)

Optionnelle — un troisième onglet (« 🛒 Courses ») à côté de Jour/Semaine
dans Nutrition, jamais imposée. Construite à partir du **même** menu de
semaine que l'onglet « Semaine » (`buildWeeklyMenu` + `applyMealOverrides`) :
si l'athlète change un repas au dernier moment, la liste change avec, sans
état séparé à resynchroniser. Navigable semaine par semaine sur toute la
durée du programme (`plan.weeks`), pas seulement la semaine en cours.

Trois étapes, chacune dans son propre module :

1. **`parsePortion.ts`** — extrait un couple {quantité, unité} d'une
   portion du catalogue ("150 g" → `{amount:150, unit:'g'}`) quand c'est
   possible. Une portion qualitative ("une pincée", "au goût") renvoie
   `undefined` plutôt que d'inventer un nombre — même règle "pas de fausse
   précision" que partout ailleurs dans l'app. Complétude vérifiée par
   test : chaque portion réellement utilisée dans `mealCatalog.ts` est soit
   parsée, soit explicitement reconnue comme qualitative.
2. **`config/nutrition/foodCategories.ts`** — classe chaque aliment du
   catalogue par rayon (Fruits & légumes / Protéines / Produits laitiers &
   alternatives / Féculents & céréales / Épicerie, condiments & snacks),
   comme le ferait un∙e diététicien∙ne ou le plan du magasin lui-même.
   Correspondance exacte par nom d'aliment (jamais de fusion approximative
   entre "Œuf" et "Œuf dur" : les considérer identiques serait une
   supposition, pas une donnée). Complétude vérifiée par test : tout
   aliment ajouté au catalogue sans catégorie fait échouer la suite plutôt
   que de retomber silencieusement dans "Épicerie".
3. **`buildShoppingList.ts`** — additionne les quantités d'un même aliment
   à travers tous les repas de la semaine (même unité seulement — pas de
   conversion g ↔ cuillère à soupe), et conserve les portions qualitatives
   telles quelles (accolées avec « + » si l'aliment apparaît aussi avec une
   quantité chiffrée, ex. "1 cuillère à soupe + au goût").

## Ce qui n'est délibérément pas fait

- Pas de montant en euros précis par repas ni par liste de courses — le
  budget ne sert qu'à orienter le coût relatif des propositions.
- Pas de calcul calorique ni de macros chiffrées par repas — les portions
  sont données en grammes/unités concrets, pas en objectif calorique
  individualisé, ce qui exigerait des données (dépense énergétique,
  objectifs de poids) que l'app ne collecte pas et ne doit pas déduire.
- Pas de recette avec étapes de préparation — la demande portait sur
  « quoi manger, quelles portions, éventuellement pourquoi », pas sur un
  livre de recettes.
