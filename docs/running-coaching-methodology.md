# Running Coaching Methodology

Sources ayant informé le catalogue de séances et le générateur de plan
running (`sports/running/`), et où chacune se retrouve concrètement dans le
code. Objectif du brief original : « se documenter sur toutes les
méthodes d'entraînement du monde entier afin d'en retenir que les plus
pertinentes et les plus performantes », tout en restant accessible aux
amateurs — chaque séance ci-dessous a une version allégée
(`SessionTier` minimal/reduced) et une description en langage courant, pas
seulement la version "élite".

## Jack Daniels — *Daniels' Running Formula* (système de paces E/M/T/I/R)

La référence la plus citée en entraînement de course scientifiquement
fondé. Son système à cinq allures distinctes est directement reflété dans
le catalogue :

- **E (Easy)** → `sessionType: 'endurance'`/`'recovery'` — la base
  aérobie, l'immense majorité du volume.
- **M (Marathon pace)** → le bloc "allure course" à l'intérieur de la
  sortie longue (`running-long-marathon-pace`) et le bloc allure course
  continu (`running-race-pace-long`).
- **T (Threshold)** → `sessionType: 'threshold'` — les "cruise intervals"
  (répétitions à allure seuil avec récupération courte), pas un effort
  continu de même durée totale : moins de fatigue accumulée pour le même
  stimulus.
- **I (Interval, VO2max)** → `sessionType: 'intervals'` — répétitions
  1000m/400m à allure VO2max, récupération égale au temps d'effort.
- **R (Repetition)** → les lignes droites (strides) en fin de footing
  facile, pour l'entretien neuromusculaire sans le volume d'une vraie
  séance de vitesse.

Les figures de `sports/running/domain/distance.ts` (semaines minimales
recommandées pour un débutant, semaines d'affûtage) s'appuient sur les
structures de plan par distance de Daniels.

## Pete Pfitzinger — *Advanced Marathoning*

Deux apports directs :

- Le travail au seuil lactique en répétitions plutôt qu'en effort continu
  (les "cruise intervals" ci-dessus, dont Pfitzinger fait aussi un pilier
  de sa phase "LT").
- L'insertion d'un **bloc à allure marathon à l'intérieur de la sortie
  longue** (`running-long-marathon-pace`) — la façon la plus spécifique de
  préparer un objectif long sans faire une séance à part entière à allure
  de course sur fatigue fraîche.

Sa recommandation d'un affûtage de 2-3 semaines pour un marathon a informé
`RUNNING_DISTANCES.marathon.taperWeeks = 2`.

## Hansons Marathon Method

Philosophie de "fatigue cumulative" : plutôt qu'une sortie longue
extrêmement longue et isolée, alterner des séances modérées répétées.
Contribution concrète : la sortie longue **avec finish rapide**
(`running-long-fast-finish`), où le dernier quart accélère vers l'allure
seuil — habituer les jambes à accélérer sur de la fatigue déjà accumulée,
la sensation exacte de fin de course.

## Arthur Lydiard — périodisation base-d'abord, côtes

Deux principes structurants :

- **Aucun travail structuré dur en phase base** — la base aérobie
  d'abord, l'intensité ensuite. Reflété dans
  `QUALITY_TYPE_BY_PHASE.base = 'endurance'` (le générateur ne place jamais
  de seuil/VO2max/tempo en phase base).
- **Les répétitions en côte** (`running-hill-repeats`) comme forme de
  travail VO2max/force-endurance à charge articulaire plus douce que le
  fractionné sur plat — la récupération en descente au trot remplace le
  chronomètre, ce qui en fait aussi une séance plus accessible qu'une
  séance de piste.

Le ratio base plus généreux donné au marathon dans
`phaseAllocation.ts` (48 % base pour le marathon contre 35 % pour le 5K)
reflète directement cette priorité Lydiard à l'aérobie pour les longues
distances.

## Renato Canova — variété du travail spécifique

Canova insiste sur la **diversité des formats** de travail spécifique
(5K/10K élite) plutôt que la répétition d'une séance unique — plusieurs
structures différentes ciblant le même système. C'est le principe derrière
les rotations à 2-3 variantes du catalogue (tempo continu ↔ fartlek, seuil
long ↔ court, VO2max 1000m ↔ 400m ↔ côtes) et derrière la rotation de la
seconde séance de qualité (`getQuality2Type` dans `weeklySlots.ts`) qui
alterne tempo/seuil/VO2max/allure course en développement et spécifique
plutôt que de répéter le même stimulus chaque semaine.

## Stephen Seiler — recherche sur l'entraînement polarisé

La recherche de Seiler sur la distribution d'intensité (beaucoup de
volume facile, peu mais un vrai stimulus dur, peu de "zone grise")
confirme le choix déjà fait côté triathlon (`training-philosophy.md` :
"polarisée / pyramidale adaptable") et se retrouve dans running par la
même structure : le rôle "easy" domine le volume hebdomadaire
(`weeklySlots.ts`), et les rôles "quality"/"quality2" sont volontairement
peu nombreux (1 à 2 par semaine) plutôt que plusieurs séances à intensité
moyenne.

## Gösta Holmér — le fartlek

Tradition suédoise du "jeu de vitesse" : alterner portions rapides et
faciles au feeling, sans allure chronométrée précise
(`running-fartlek`). Développe le même système que le tempo continu, en
version moins intimidante — un choix délibéré pour rester **accessible
aux amateurs**, conformément à la demande explicite du brief produit.

## Jeff Galloway — strides et accessibilité

Les lignes droites (strides) en fin de footing facile
(`running-easy-strides`) et la philosophie run-walk-run de Galloway ont
orienté le choix de garder les séances "faciles" du catalogue explicitement
sans pression d'allure — la description de chaque template en langage
courant, pas en jargon d'allure cible, pour un débutant qui n'a pas encore
de repères de vitesse personnels.

## Hal Higdon — plans débutants, repères de durée

Les plans "Novice" de Higdon (nombre de semaines minimum recommandé avant
un objectif donné, structure hebdomadaire simple pour un premier 10K ou un
premier semi) ont informé les valeurs
`recommendedMinWeeksBeginner` de `sports/running/domain/distance.ts` (6
semaines pour un 5K, 8 pour un 10K, 10 pour un semi, 16 pour un marathon) —
des seuils qui déclenchent un avertissement plutôt qu'un plan
silencieusement agressif quand le délai réel est plus court (cohérent avec
la règle "pas de fausse science" de `training-philosophy.md`).

## Ce qui reste volontairement hors scope de ce rollout

- **Zones d'allure course personnalisées par un test VDOT complet**
  (Daniels calcule une table entière d'allures à partir d'une performance
  récente) — le profil ne collecte aujourd'hui qu'une allure seuil connue,
  pas un calcul VDOT complet. Reste une amélioration possible d'un futur
  milestone (M6.x), pas de ce rollout initial.
- **Course-pace individualisé par distance cible dans le catalogue** — les
  blocs "allure course" du catalogue portent une note ("à ton allure cible
  de course") plutôt qu'un chiffre calculé, en cohérence avec le principe
  "zones toujours relatives" déjà appliqué au triathlon
  (`core/training/WorkoutBlock.ts`).
