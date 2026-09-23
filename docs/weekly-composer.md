# Weekly Stimulus Composer

Modules : `sports/triathlon/coaching/weeklyStimulusComposer.ts`,
`sports/triathlon/coaching/limiterAnalysis.ts`, `core/coaching/sessionRequirement.ts`,
`sports/triathlon/planning/buildWeekSessions.ts`.

## "Le triathlon n'est pas trois plans séparés"

Principe non négociable du brief (§24) : le moteur ne pose jamais la
question "que fait-on en natation cette semaine ?" indépendamment du vélo
et de la course. La question est : **quel est le meilleur ensemble de
stimuli triathlon que cet athlète peut réellement absorber cette semaine ?**
— en tenant compte des interactions entre disciplines (fatigue partagée,
séances incompatibles en voisinage, brick qui combine deux disciplines en
une seule séance).

## Training Intelligence V2.1 — composition dynamique

V2 décidait déjà *quel type* de séance donner à chaque discipline, mais
*combien de fois* chaque discipline s'entraînait cette semaine restait
dicté par `WEEKLY_SLOT_DISCIPLINES`, une table fixe indexée uniquement par
le **nombre de jours** disponibles — pas par la phase, pas par le budget
temps réel, pas par l'analyse limiteur/plus-forte. Deux contournements
documentés (`applyLimiterSwimTouch`, `applyBrickInsertion`) *mutaient*
ensuite cette allocation figée après coup : une deuxième touche natation
pour l'athlète dont la natation est le limiteur n'existait qu'en
**remplaçant** un créneau que la table avait déjà donné à une autre
discipline, et disparaissait silencieusement quand aucun créneau de ce
type n'était disponible (semaines de brick, semaines à peu de jours).

**`WEEKLY_SLOT_DISCIPLINES` et `sports/triathlon/planning/weeklySlots.ts`
ont été entièrement supprimés dans Training Intelligence V2.1.** Il n'existe
plus aucune table figée décidant de la fréquence par discipline nulle part
dans le pipeline triathlon. `generateWeeklySessionRequirements`
(`weeklyStimulusComposer.ts`) est désormais la **seule** source de "quelles
disciplines s'entraînent combien de fois cette semaine, et pourquoi" — elle
ne connaît aucun jour calendaire, seulement le budget de la semaine et
l'analyse limiteur/plus-forte de l'athlète.

### Le pipeline

```
ATHLETE MODEL → GOAL → TRAINING PHASE → LIMITER/STRENGTH ANALYSIS
  → WEEKLY TRAINING BUDGET → WEEKLY STIMULUS REQUIREMENTS
  → SESSION REQUIREMENTS → SESSION PRIORITIES
  → RECOVERY CONSTRAINTS → DYNAMIC CALENDAR PLACEMENT
```

1. **`computeWeeklyTrainingBudget`** — combien de jours et de minutes cette
   semaine offre réellement, plus l'accès piscine. Un **plafond**, jamais
   une cible (brief §25/§26) : le compositeur n'a jamais le droit de
   dépenser tout le budget juste parce qu'il existe.
2. **`generateWeeklySessionRequirements`** — décide, à partir du seul
   budget + de l'analyse limiteur/plus-forte, une liste de
   `SessionRequirement` : discipline, type de séance, priorité,
   durée préférée, durée minimale effective, coût de fatigue, familles
   compatibles/incompatibles — **aucun jour calendaire n'est encore
   attaché**. Cette liste ne dépend jamais du nombre de jours seul.
3. **Placement** (`buildWeekSessions.ts`) — attribue chaque
   `SessionRequirement` à un vrai jour du calendrier, en respectant les
   contraintes réelles (accès piscine, durée disponible), puis instancie le
   gabarit du catalogue correspondant. Le placement **exécute** une
   décision déjà prise ; il ne la prend jamais.

### `SessionRequirement` (`core/coaching/sessionRequirement.ts`)

Type sport-agnostique, sortie complète du compositeur pour la semaine :
discipline, `familyId`, type de séance, priorité, `preferredDurationMin`
(la durée idéale du gabarit visé), `minimumEffectiveDurationMin` (en
dessous, ce n'est plus le même stimulus — brief §7), `requiresPoolAccess`,
`fatigueCost`/`recoveryRequirement`, familles compatibles/incompatibles,
`occurrenceIndex` et les codes de raison (`reasonCodes`) qui expliquent
*pourquoi* cette séance existe (`'ANCHOR_SESSION'`, `'LIMITER_DEVELOPMENT_TOUCH'`,
`'STRONGEST_MAINTENANCE_TOUCH'`, `'POOL_UNAVAILABLE_REALLOCATED'`,
`'BRICK_PROGRESSION'`, `'RECOVERY_BUDGET_AVAILABLE'`, `'MINIMAL_COVERAGE'`, …).

## Limiter / Strength Analysis (`limiterAnalysis.ts`)

Avant même de composer la semaine, `analyzeLimiters(profile)` compare les
trois niveaux déclarés (`disciplineLevels.swim/bike/run`) entre eux :

```ts
interface DisciplineStrengthAnalysis {
  levels: Record<'swim'|'bike'|'run', Level>
  limiter: 'swim'|'bike'|'run'      // la discipline qui a le plus besoin de développement
  strongest: 'swim'|'bike'|'run'    // la discipline maintenable avec proportionnellement moins de temps
  isBalanced: boolean               // les trois niveaux sont identiques
  hasTestedMetric: Record<...>      // signal de confiance, jamais une réécriture du niveau déclaré
  explanation: string
}
```

- **Départage déterministe** quand deux disciplines partagent le même
  niveau : la natation est favorisée comme limiteur (un déficit technique
  en natation est le limiteur triathlon le plus courant et a le meilleur
  retour sur travail technique ciblé, brief §19) ; la course est favorisée
  comme discipline la plus forte (protéger la course d'être
  silencieusement sous-priorisée, car sur-réduire son volume est la façon
  la plus rapide de perdre en forme sur cette discipline).
- Une métrique testée (FTP/CSS/allure seuil) n'écrase **jamais** le niveau
  déclaré — c'est une note de confiance explicative, pas une source de
  vérité concurrente (pas de fausse précision à partir d'un seul test).

Cette analyse influence désormais **deux** endroits du pipeline, pas un
seul :

- la rotation de la séance secondaire (`getLimiterAdjustedRotation`, ci-dessous) ;
- **depuis V2.1**, le départage de `claimDays` (`buildWeekSessions.ts`) quand
  deux disciplines réclament le même "grand jour" de la semaine (voir
  defect log, `docs/coaching-methodology.md`) — le limiteur passe en
  premier, la discipline la plus forte en dernier, plutôt que de laisser
  la durée médiane du catalogue trancher au hasard.

## La rotation ajustée au limiteur (`getLimiterAdjustedRotation`)

La séance secondaire d'une discipline (2ᵉ occurrence de la semaine, en
développement/spécifique) suit une rotation sur 4 semaines qui dépend de la
position de cette discipline dans l'analyse :

| Position | Rotation | Logique |
|---|---|---|
| Discipline neutre (ni limiteur ni la plus forte) | `GENERIC_ROTATION` — endurance → sortie longue → VO2max/fractionné → endurance | Rotation par défaut, développement classique |
| **Limiteur** | `LIMITER_DEVELOPMENT_ROTATION` — remplace l'entrée haut de gamme (VO2max/fractionné) par une deuxième touche technique/développement | Brief §19 : "un nageur faible bénéficie davantage de travail technique ciblé que de plus de volume ou d'intensité" — généralisé aux trois disciplines |
| **La plus forte** | `STRENGTH_MAINTENANCE_ROTATION` — abandonne les entrées longues/haut de gamme, reste à un défaut facile/entretien | Maintenir sans lui consacrer un temps disproportionné (brief §18/§24) |

Un athlète équilibré (`isBalanced`) reçoit la rotation générique pour les
trois disciplines — rien à biaiser sans écart réel entre disciplines.

`getSecondaryType` applique en plus deux garde-fous génériques (trouvés
lors de l'audit V2.1, voir le defect log) avant de renvoyer l'entrée de
rotation choisie :

- elle ne renvoie jamais le **même type que l'ancre** de la semaine (une
  "touche secondaire" identique à l'ancre double silencieusement le
  stimulus au lieu d'en ajouter un second) ;
- sur la semaine la plus dure du cycle (tier `peak`), elle ne renvoie
  jamais un type que le registre des familles (`incompatibleNeighbors`)
  marque explicitement incompatible avec l'ancre de cette même discipline
  — évite d'empiler deux stimuli vélo indépendamment exigeants (Sweet Spot
  *peak* + VO2max) la même semaine que la natation et la course sont déjà
  au plus dur (defect log — Semaine 8).

## Placement au calendrier (`buildWeekSessions.ts`)

1. **`computeWeeklyTrainingBudget`** puis **`generateWeeklySessionRequirements`**
   décident quoi (voir plus haut).
2. **`placeRequirements`** résout le placement en deux temps : d'abord les
   `SessionRequirement` qui exigent l'accès piscine, contre les seuls jours
   avec piscine ; puis tout le reste contre ce qu'il reste. Généralise à une
   future contrainte de ressource (home-trainer, piste, eau libre) sans
   changer de forme.
3. **`claimDays`** — au sein de chaque sous-problème, réclame les jours par
   priorité d'abord, puis par position limiteur/plus-forte de l'athlète,
   puis par durée préférée décroissante (brief §7 : un gros besoin de temps
   doit réclamer un grand jour avant qu'une petite séance ne le prenne sans
   raison).
4. **`resolveRecoveryConflicts`** — une seule passe bornée de réparation
   des conflits de récupération sur jours adjacents, en utilisant les
   métadonnées existantes `fatigueCost`/`incompatibleNeighbors` des
   Workout Families (voir `docs/workout-families.md`) — jamais un solveur
   de contraintes exhaustif (brief §13 met en garde contre les règles
   universelles implémentées aveuglément).
5. **`pickBestFittingTemplate`** — au sein d'un créneau, choisit le gabarit
   du catalogue qui correspond au type visé et rentre dans le temps
   disponible, en dégradant vers des types plus faciles avant de rogner sur
   la durée à l'aveugle (`EASY_FALLBACK_BY_DISCIPLINE`), puis en préférant
   le gabarit le plus long qui rentre et en ne laissant `rotationKey`
   tourner qu'entre variantes structurelles de longueur comparable (moins
   de 15 minutes d'écart) — jamais entre une variante courte "filet de
   sécurité" et la version complète (`pickTemplate.ts`, defect log).
6. Une exigence dont le gabarit finalement choisi tombe sous la durée
   minimale effective de sa propre famille est **abandonnée** plutôt que
   programmée comme séance symbolique (brief §26 : jamais de remplissage).

## Ce qui n'a pas changé

- Le Workout Family Engine et le Progression Engine restent inchangés.
- Aucun LLM n'intervient dans une décision de composition ou de placement
  — chaque décision reste déterministe et traçable via `reasonCodes`.
- Aucun schéma persisté n'a changé : `SessionRequirement` est une structure
  intermédiaire interne au générateur, jamais sérialisée.
