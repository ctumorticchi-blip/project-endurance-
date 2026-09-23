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

## Training Intelligence V2.1 — composition dynamique + audit de coaching approfondi

La limitation ci-dessus (`WEEKLY_SLOT_DISCIPLINES` fixe par nombre de
jours) **n'existe plus** : la table et son module (`weeklySlots.ts`) ont
été entièrement supprimés. Voir `docs/dynamic-composition.md` pour
l'architecture de remplacement (`SessionRequirement` + placement en deux
temps) et pourquoi elle généralise la 3ᵉ correction ci-dessus au lieu de
la contourner par un mécanisme de plus.

L'audit V2.1 a repris le plan Gold Standard **séance par séance** (pas
seulement semaine par semaine), avec deux semaines nommément soupçonnées
par le brief — Semaine 8 (CSS + tempo course + Sweet Spot + VO2max vélo la
même semaine) et Semaine 11 (seuil natation + seuil course + seuil vélo la
même semaine) — plus le développement vélo long, la durabilité course, le
contenu qualitatif natation, la suffisance de la progression brick et la
cohérence de l'affûtage. Nouveaux défauts réels trouvés et corrigés :

### 4. Le renforcement était absent de presque toutes les semaines de base/développement

- **Comportement fautif** : à budget de renforcement identique, les
  semaines 1/2/3/5 (base, hors semaine de deload) n'avaient **aucune**
  séance de renforcement du tout.
- **Cause racine** : l'estimation "combien de minutes reste-t-il pour le
  renforcement cette semaine" additionnait la durée **idéale** de chaque
  séance cœur déjà décidée (`preferredDurationMin`, ex. ~150min pour
  l'ancre vélo "long" en base) plutôt qu'une estimation réaliste de ce
  qu'un seul jour peut effectivement absorber — surestimant
  systématiquement le temps déjà "consommé" et donc sous-estimant le temps
  restant.
- **Correction moteur** : chaque contribution à cette estimation est
  désormais plafonnée à la moyenne minutes/jour de la semaine avant d'être
  sommée (`weeklyStimulusComposer.ts`, `estimatedCoreMinutes`).
- **Test de non-régression** : couvert par la régénération du Gold
  Standard (`goldStandard.test.ts`) — le renforcement apparaît désormais
  chaque semaine de base/développement.

### 5. La touche secondaire vélo dégénérait presque toujours en récupération de 30min

- **Comportement fautif** : au lieu de la rotation prévue
  (endurance/sortie longue/VO2max), la touche secondaire vélo tombait
  presque à chaque fois sur une récupération de 30min.
- **Cause racine** : `bike-endurance` (le type le plus fréquent de la
  rotation) n'avait qu'un seul gabarit `standard` de 70min — bien trop
  long pour la plupart des petits jours d'une semaine réelle. La chaîne de
  repli (`EASY_FALLBACK_BY_DISCIPLINE`) tombait alors directement sur
  `recovery`, qui a toujours un gabarit court.
- **Correction moteur** : nouveau gabarit `bike-endurance-reduced` (40min,
  `tier: 'standard'` délibérément — pas `'reduced'`, pour rester
  atteignable en semaine normale, pas seulement en semaine de deload).
- **Test de non-régression** : couvert par la régénération du Gold
  Standard ; la touche secondaire vélo montre désormais une vraie
  diversité de type au lieu de systématiquement `recovery`.

### 6. La rotation de gabarits gaspillait le plus grand jour de la semaine un mandat sur deux

- **Comportement fautif** : après la correction n°5, la touche vélo
  "secondaire" tombait parfois sur le gabarit 40min *même quand le plus
  grand jour de la semaine (90min) était disponible pour la séance clé* —
  gaspillant le jour le plus important de la semaine un cycle de rotation
  sur deux.
- **Cause racine** : `pickTemplate.ts`'s `matchType` triait les gabarits
  qui rentrent par ordre **alphabétique d'id**, et laissait `rotationKey`
  tourner sur l'ensemble — sans distinguer "deux variantes structurelles
  de longueur comparable" (ex. Sweet Spot 55/65min) d'un "filet de
  sécurité de durée" bien plus court (endurance 40/70min).
- **Correction moteur** : `matchType` trie désormais par durée
  décroissante et ne laisse `rotationKey` tourner qu'entre gabarits à
  moins de 15 minutes du plus long qui rentre (`STRUCTURAL_VARIANT_MARGIN_MIN`).
- **Test de non-régression** : `buildWeekSessions.test.ts` — "injects a
  long-endurance secondary touch…" (isolé de l'effet de repli de durée).

### 7. Semaine 8 : Sweet Spot (pic) + VO2max vélo la même semaine que CSS natation + tempo course

- **Scénario** : audit explicitement demandé par le brief (§16). Semaine
  la plus dure du bloc développement (tier `peak`) pour un athlète dont le
  vélo n'est ni le limiteur ni le point fort.
- **Comportement fautif** : la semaine combinait un ancre vélo Sweet Spot
  *déjà* montée en palier "pic" (77min) avec une touche secondaire vélo
  VO2max — deux séances vélo indépendamment exigeantes la même semaine,
  en plus d'une natation CSS et d'une course tempo déjà à leur type le
  plus dur du bloc. `quality~=5`/`highcost~=3`, le maximum du plan entier.
- **Cause racine** : le cycle de charge (`BUILD_CYCLE_LOAD`, 4 semaines)
  et la rotation de touche secondaire (`GENERIC_ROTATION`, 4 entrées)
  placent toutes les deux leur entrée la plus exigeante à la même position
  (la 3ᵉ semaine du cycle) — une coïncidence structurelle, pas une
  décision de coaching. Rien ne consultait le registre des familles pour
  éviter d'empiler deux stimuli marqués incompatibles.
- **Correction moteur** (généralisée, ne cible pas "la semaine 8") :
  `getSecondaryType` (`weeklyStimulusComposer.ts`) ne renvoie plus jamais
  un type identique à l'ancre de la semaine, et sur une semaine `peak`, ne
  renvoie jamais un type dont la famille est listée dans
  `incompatibleNeighbors` de la famille de l'ancre — réutilise les
  métadonnées déjà authored (`BIKE_SWEET_SPOT.incompatibleNeighbors`
  contient déjà `'BIKE_VO2'`) plutôt qu'une nouvelle table "haut de
  gamme" par discipline.
- **Test de non-régression** : `buildWeekSessions.test.ts` — "never stacks
  a VO2max secondary touch onto an already tier-bumped (peak) bike anchor".

### 8. Le développement vélo/course "sortie longue" était structurellement inatteignable

- **Comportement fautif** : l'ancre base-phase vélo/course, censée être
  `long`, dégénérait en `endurance` classique presque toutes les semaines
  — le développement de la durabilité longue n'avait jamais lieu.
- **Cause racine (vélo)** : tous les gabarits `bike/long` en palier
  `standard`/`peak` (150/175min) dépassent largement le plus grand jour
  réaliste d'un athlète à ~6h/semaine (90min pour le Gold Standard) ; seul
  le gabarit `reduced` (90min, réservé aux semaines de deload) rentrait —
  rendant le développement "sortie longue" accidentellement réservé aux
  semaines les plus légères.
- **Cause racine (vélo vs course, jour partagé)** : vélo et course
  réclament chacun le "grand jour" de la semaine pour leur ancre `long` ;
  l'ancien départage (durée préférée décroissante) laissait la durée
  **médiane du catalogue** décider — le vélo gagnait toujours, y compris
  pour un athlète dont le *vélo* serait le limiteur, ce qui aurait dû
  inverser le résultat.
- **Correction moteur** : nouveau gabarit `bike-long-compact` (75min,
  `tier: 'standard'`, même logique que la correction n°5) ; `claimDays`
  (`buildWeekSessions.ts`) départage désormais par position
  limiteur/plus-forte de l'athlète *avant* la durée préférée.
- **Test de non-régression** : `buildWeekSessions.test.ts` — "gives the
  big day to the limiter discipline's long anchor, not whichever
  discipline the catalog happens to favor" (vérifie que le résultat
  s'inverse entre deux athlètes aux limiteurs opposés).

### 9. La progression brick à 3 étages collapsait en 2 séances identiques

- **Scénario** : audit explicitement demandé par le brief (§21 — "un brick
  isolé sur 16 semaines est-il vraiment suffisant ?"). Le moteur génère une
  vraie escalade `BRICK_ADAPTATION → BRICK_SPECIFIC → BRICK_RACE_REHEARSAL`
  sur la phase spécifique.
- **Comportement fautif** : la semaine médiane (`BRICK_SPECIFIC`) et la
  dernière semaine (`BRICK_RACE_REHEARSAL`) produisaient la **séance
  identique** (même titre, même durée) — l'escalade finale était illusoire.
- **Cause racine (double)** : (a) `BRICK_RACE_REHEARSAL` n'avait qu'un
  gabarit de 130min, au-delà de tout jour réaliste, donc toujours
  indisponible ; (b) le palier catalogue utilisé au placement était celui
  de la semaine (son propre cycle de charge, sans rapport), pas celui de
  l'étage brick — deux semaines de phase spécifique tombant par coïncidence
  sur le même palier `peak` du cycle de charge produisaient donc le même
  gabarit quel que soit l'étage réellement demandé.
- **Correction moteur** : nouveau gabarit `brick-race-rehearsal-compact`
  (90min, `tier: 'peak'`, escalade qualitative — pas seulement plus long) ;
  `buildWeekSessions.ts` force désormais le palier vélo/course-brick selon
  **l'étage brick réellement demandé** (`requirement.familyId`), pas selon
  le palier générique de la semaine.
- **Test de non-régression** : `buildWeekSessions.test.ts` — "gives
  BRICK_SPECIFIC and BRICK_RACE_REHEARSAL genuinely different sessions
  even on same-tier weeks" ; `goldStandard.test.ts`'s test de progression
  brick vérifie désormais que **chaque** semaine spécifique a un titre
  différent, pas seulement qu'il existe plus d'un titre distinct sur
  l'ensemble de la phase (une assertion trop faible qui laissait passer ce
  défaut).

### 10. Le vélo disparaissait entièrement en semaine de course, et sa touche secondaire en affûtage

- **Scénario** : audit de cohérence d'affûtage/course (brief §22).
- **Comportement fautif** : la semaine de course ne contenait que natation
  + course, jamais de vélo — alors que le compositeur demandait bien les
  trois disciplines. En affûtage, la touche secondaire vélo (récupération)
  disparaissait aussi silencieusement, gaspillant un jour déjà réservé.
- **Cause racine** : contrairement à `SWIM_RECOVERY`/`RUN_RECOVERY`, **aucune
  famille `BIKE_RECOVERY` n'existait dans le registre**
  (`workoutFamilies.ts`) — alors que le gabarit `bike-recovery` existe
  depuis toujours dans le catalogue. `getFamilyForSession('bike',
  'recovery')` renvoyait donc systématiquement `undefined`, et
  `generateWeeklySessionRequirements` abandonne silencieusement (`if
  (!family) continue`) toute exigence sans famille résolue — sans
  avertissement, sans dégradation visible, juste absente.
- **Correction moteur** : ajout de la famille `BIKE_RECOVERY` manquante,
  au même schéma que `SWIM_RECOVERY`/`RUN_RECOVERY`.
- **Impact mesuré** : +3 séances sur le Gold Standard (une par semaine 14,
  15, 16) — c'est le défaut au plus grand impact trouvé lors de cet audit :
  un trou de registre silencieux, pas un réglage de justesse de coaching.
- **Test de non-régression** : couvert par la régénération du Gold
  Standard (le vélo apparaît désormais chaque semaine 14-16).

## Limitation connue

La rotation de touche secondaire (`GENERIC_ROTATION`/`LIMITER_DEVELOPMENT_ROTATION`/
`STRENGTH_MAINTENANCE_ROTATION`) et le cycle de charge
(`BUILD_CYCLE_LOAD`) ont tous deux une longueur de 4 — un choix
d'authoring, pas une contrainte du moteur. Les défauts n°7 et n°9 montrent
que deux cycles de même longueur peuvent faire coïncider silencieusement
leurs positions "les plus dures" ; les garde-fous ajoutés (comparaison de
familles incompatibles, sélection de palier par étage plutôt que par
semaine) corrigent les cas trouvés sans supposer qu'aucune autre
coïncidence de ce type n'existe ailleurs — à surveiller lors d'un futur
élargissement du catalogue ou des rotations.
