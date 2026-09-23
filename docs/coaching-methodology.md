# Coaching Methodology — Training Intelligence V2

Document central de la refonte "Training Intelligence V2" (TIV2). Décrit le
principe directeur, le pipeline conceptuel, la classification des preuves
utilisée dans tout le nouveau code, les sources ayant informé la
méthodologie triathlon, et le journal des défauts de coaching trouvés et
corrigés pendant la revue du Gold Standard.

## Principe directeur

> Project Endurance ne génère pas un calendrier de séances. Il prescrit une
> **progression de stimuli d'entraînement** pour un athlète précis, vers une
> course précise, et adapte cette progression selon la réponse réelle de
> l'athlète.

Une bonne programmation n'est pas une collection de bonnes séances : c'est
une **progression cohérente de stimuli**. Trois questions doivent toujours
avoir une réponse explicable :

1. Pourquoi cette séance ?
2. Pourquoi mon programme ressemble-t-il à ça ?
3. Pourquoi mon coach l'a-t-il changé ?

## Le pipeline conceptuel

```
ATHLETE MODEL → GOAL MODEL → LIMITER/STRENGTH ANALYSIS → TRAINING PHASE
  → WEEKLY STIMULUS REQUIREMENTS → DISCIPLINE ALLOCATION
  → WORKOUT FAMILY SELECTION → WORKOUT PROGRESSION LEVEL
  → INDIVIDUAL PRESCRIPTION → CALENDAR PLACEMENT → SESSION EXECUTION
  → ATHLETE RESPONSE → PROGRESS/MAINTAIN/REGRESS/RECOVER/RECALIBRATE
  → NEXT TRAINING DECISION
```

Le placement au calendrier (`buildWeekSessions.ts`) n'est **pas le cerveau
du système** — il exécute une décision déjà prise plus haut dans le
pipeline (quels stimuli cette semaine a besoin, dans quel ordre de
priorité). Voir `docs/weekly-composer.md` pour le détail de cette étape.

Chaque étape correspond à un module concret :

| Étape | Module |
|---|---|
| Athlete Model | `core/athlete/AthleteProfile.ts` |
| Goal Model | `core/goals/RaceGoal.ts` |
| Limiter/Strength Analysis | `sports/triathlon/coaching/limiterAnalysis.ts` |
| Training Phase | `sports/triathlon/planning/phaseAllocation.ts` |
| Weekly Stimulus Requirements | `sports/triathlon/coaching/weeklyStimulusComposer.ts` |
| Discipline Allocation / Calendar Placement | `sports/triathlon/planning/weeklySlots.ts`, `buildWeekSessions.ts` |
| Workout Family Selection | `sports/triathlon/coaching/workoutFamilies.ts` (docs/workout-families.md) |
| Workout Progression Level | `engine/progression/` (docs/progression-engine.md) |
| Individual Prescription | `engine/intensity/resolveIntensityPrescription.ts` (docs/intensity-model.md) |
| Athlete Response → décision | `engine/progression/processSessionFeedback.ts` |
| Vie réelle / imprévus | `engine/adaptation/decideAdaptation.ts` (docs/adaptation-engine.md) — un système **distinct** du précédent, voir plus bas |

### Deux systèmes de décision, distincts et complémentaires

- **`engine/adaptation`** (`AdaptationDecision`) réagit à *aujourd'hui* :
  une séance en particulier, un imprévu (fatigue, temps réduit, séance
  manquée). KEEP/REDUCE/INCREASE/MOVE/REPLACE/REMOVE.
- **`engine/progression`** (`ProgressionResponse`) réagit à la *tendance*
  d'une famille de séance sur plusieurs expositions : que doit cibler la
  *prochaine* prescription de cette famille. PROGRESS/MAINTAIN/REGRESS/
  RECOVER/RECALIBRATE.

Les deux peuvent se déclencher le même jour pour la même séance sans se
contredire : la vie réelle peut raccourcir une séance aujourd'hui pendant
que le moteur de progression conclut séparément qu'il est temps de monter
de niveau la *prochaine* fois que cette famille sera prescrite.

## Classification des preuves

Chaque règle majeure du moteur porte une étiquette (`EvidenceClassification`,
`core/coaching/evidenceClassification.ts`) :

- **`EVIDENCE_BASED`** — soutenu raisonnablement par la littérature en
  science de l'exercice ou un principe physiologique largement admis
  (surcharge progressive, spécificité, existence d'un seuil
  lactique/ventilatoire comme ancre de zone).
- **`COACHING_HEURISTIC`** — largement utilisé en coaching réel, mais la
  preuve est incomplète, dépendante du contexte, ou les chiffres exacts
  varient selon le coach/programme (un microcycle charge/charge/pointe/
  deload sur 4 semaines, une distribution polarisée ~80/20, les "cruise
  intervals" pour le seuil plutôt qu'un effort continu).
- **`PRODUCT_RULE`** — une règle déterministe que Project Endurance
  introduit pour l'ergonomie, la cohérence ou la sécurité, pas une
  affirmation physiologique (ex. les seuils RPE exacts qui déclenchent une
  décision, "jamais deux séances KEY_A consécutives sans raison").

Cette classification apparaît directement dans le code
(`WorkoutFamily.evidenceClassification`, commentaires des constantes de
seuil) plutôt que seulement en prose ici — voir `docs/workout-families.md`
pour la classification complète de chaque famille.

## Sources ayant informé la méthodologie triathlon

Comme pour `docs/running-coaching-methodology.md`, ces sources sont des
principes de coaching largement reconnus, pas des PDF spécifiques
extraits/vérifiés dans ce rollout — quand un chiffre précis n'a pas de
source vérifiable, il est marqué `COACHING_HEURISTIC`/`PRODUCT_RULE` plutôt
que présenté comme une certitude scientifique (brief : "jamais de fausse
science").

- **Joe Friel — *The Triathlete's Training Bible*.** Référence la plus
  citée en périodisation triathlon amateur/compétiteur. La structure de
  phases base → développement → spécifique → affûtage → course, la
  distinction stimulus vs. volume, et le concept de "limiteur" (la
  discipline la plus faible mérite disproportionnellement plus de travail
  de développement) viennent directement de cette tradition — c'est le
  principe derrière `limiterAnalysis.ts` et le Weekly Stimulus Composer.
- **Concept de Critical Swim Speed (CSS, Absaroka/Rodriguez).** Le seuil de
  nage repose sur un protocole de test simple (2 épreuves chronométrées,
  400m et 200m) largement utilisé en natation triathlon comme ancre de
  zone — analogue à la FTP à vélo et à l'allure seuil en course. Reflété
  dans `KnownMetrics.cssSecPer100m` et les zones d'allure natation.
  `EVIDENCE_BASED` comme concept (existence d'une vitesse soutenable
  seuil), `COACHING_HEURISTIC` pour le protocole de test exact.
- **Méthodologie brick (USAT / littérature triathlon générale).** La
  transition vélo → course produit une sensation de jambes lourdes
  spécifique (redistribution du flux sanguin) qui ne s'entraîne qu'en
  l'expérimentant réellement — d'où la distinction
  BRICK_ADAPTATION/BRICK_SPECIFIC/BRICK_RACE_REHEARSAL (voir
  `docs/workout-families.md`), et la règle "jamais un brick dur chaque
  semaine seulement parce que l'athlète prépare un triathlon".
- **Stephen Seiler — entraînement polarisé.** Déjà cité dans
  `running-coaching-methodology.md` et `training-philosophy.md` ; la même
  logique s'applique aux trois disciplines triathlon : le volume facile
  domine, l'intensité est peu fréquente mais réelle, peu de "zone grise".
- **Sweet Spot Training (concept popularisé notamment par TrainerRoad/Frank
  Overton).** Le travail juste sous le seuil (88-94% FTP) comme meilleur
  ratio charge/fatigue pour développer la puissance seuil sans le coût de
  récupération d'un vrai travail au seuil — reflété dans
  `BIKE_SWEET_SPOT`. `EVIDENCE_BASED` comme principe (adaptation au seuil
  via un stimulus légèrement sous-maximal), `COACHING_HEURISTIC` pour la
  fourchette exacte 88-94%.

## Journal des défauts de coaching (Coaching Defect Log)

Défauts réels trouvés en relisant le plan Gold Standard généré par le
moteur (`src/simulation/goldStandard.test.ts`, brief §34) — jamais corrigés
en patchant la sortie, toujours en corrigeant le moteur, avec un test de
non-régression à chaque fois.

### 1. Le brick dégradait systématiquement en séance de transition de 30min

- **Scénario** : athlète Gold Standard, 6 jours/semaine, disponibilité
  inégale (90/60/60/60/45/45 min).
- **Comportement fautif** : sur les 16 semaines, le seul brick généré était
  une séance de transition de 30min, jamais un vrai brick vélo-course
  (60-130min).
- **Cause racine** : `buildWeekSessions.ts` attribuait les jours dans
  l'ordre strict du tableau de slots. Le slot brick était toujours traité
  après les deux occurrences vélo, si bien qu'il ne restait que les deux
  jours à plus faible disponibilité (45min) — jamais assez pour le plus
  court gabarit de brick (60min).
- **Correction moteur** : `dayAssignmentRank` donne désormais au brick la
  priorité de réclamation de jour juste après les séances clé, avant les
  autres slots secondaires/optionnels.
- **Test de non-régression** : `buildWeekSessions.test.ts` — "gives the
  brick slot a day with enough time for a real brick, not whatever is left
  over".

### 2. Le renforcement recevait toujours la version allégée, jamais la version complète

- **Comportement fautif** : de la semaine 1 à la semaine 15, absolument
  toutes les séances de renforcement étaient la version "entretien" de
  20min, jamais la version "général" de 35min — y compris en pleine phase
  base/développement, quand la capacité de récupération n'est pas rare.
- **Cause racine** : le renforcement n'avait aucun `preferredType` du
  tout. `pickBestFittingTemplate` retombait alors sur "le gabarit le plus
  court de la discipline qui rentre dans le temps disponible", ce qu'un
  catalogue à deux gabarits résout systématiquement vers le plus court.
- **Correction moteur** : le renforcement reçoit désormais un vrai
  `preferredType` ('strength'), sensible au palier de charge de la
  semaine comme toutes les autres disciplines ; les phases
  spécifique/affûtage/course forcent le palier allégé pour protéger la
  capacité de récupération des séances triathlon-spécifiques.
- **Test de non-régression** : `buildWeekSessions.test.ts` — "gives
  base/build a full strength stimulus" et "always uses the lighter
  maintenance circuit in specific/taper/race".

### 3. La natation — le vrai limiteur de l'athlète Gold Standard — ne recevait qu'une séance/semaine, comme un nageur fort

- **Comportement fautif** : sur les 16 semaines, la natation n'apparaissait
  jamais plus d'une fois par semaine, quel que soit le nombre de jours
  d'entraînement déclarés — identique à un athlète pour qui la natation
  serait déjà un point fort. Toute la rotation de développement du
  limiteur construite pour ce cas précis (`getLimiterAdjustedRotation`,
  commit 721df0e) était donc **structurellement inatteignable** pour la
  natation, ce qui contredisait directement le critère de succès n°1 du
  brief.
- **Cause racine** : `WEEKLY_SLOT_DISCIPLINES` ne donne jamais à la
  natation plus d'une occurrence, quel que soit le nombre de jours. De
  plus, un bug latent plus profond existait : les créneaux non-natation
  réclamaient un jour via un simple `shift()` sans tenir compte de l'accès
  piscine — un slot clé course/vélo pouvait ainsi "voler" un des deux seuls
  jours piscine avant que la logique de recherche piscine de la natation
  n'ait son tour. Invisible avec une seule occurrence de natation
  (il restait toujours un jour piscine de secours), le bug devenait
  bloquant dès qu'une deuxième touche natation était nécessaire.
- **Correction moteur** : nouvelle paire
  `shouldInsertLimiterSwimTouch`/`applyLimiterSwimTouch` (même schéma que
  l'insertion de brick) qui donne une deuxième touche hebdomadaire de
  natation à un athlète dont la natation est le limiteur, en sacrifiant un
  créneau de sa discipline **la plus forte** plutôt qu'une position fixe.
  La natation obtient désormais la priorité de réclamation de jour la plus
  haute (avant même les séances clé) puisqu'elle est la seule discipline
  dont le jour doit spécifiquement avoir accès à une piscine.
- **Test de non-régression** : `buildWeekSessions.test.ts` — "still gives
  swim its pool day even though brick is now claimed earlier" ;
  `generateTrainingPlan.test.ts` — le test de succès n°1 compare désormais
  aussi le nombre de séances natation entre un nageur faible et un nageur
  fort (impossible avant cette correction).

## Limitation connue

`WEEKLY_SLOT_DISCIPLINES` reste une table fixe par nombre de jours — une
deuxième touche natation n'est possible que si un créneau de la discipline
la plus forte de l'athlète existe à sacrifier cette semaine-là (elle
n'apparaît donc pas sur les semaines de brick, ni en dessous de 4-5 jours
d'entraînement selon la discipline la plus forte). Documenté plutôt que
silencieusement accepté — une restructuration plus profonde de cette table
reste un candidat pour un futur milestone si un besoin plus général de
troisièmes/quatrièmes touches par discipline émerge.
