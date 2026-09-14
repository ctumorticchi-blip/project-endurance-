# Training Engine

Ce document décrit le moteur de génération et de représentation du plan
(`engine/planning`, `sports/triathlon/planning`, `sports/triathlon/sessions`).
Pour le moteur d'adaptation post-séance, voir `adaptation-engine.md`.

## Modèles de données clés

Définis progressivement dans `core/`, `sports/triathlon/domain/` et
`shared/types/` au fil de M0.1–M0.4 :

- `AthleteProfile` — expérience, niveaux par discipline, métriques connues.
- `RaceGoal` — distance (Sprint / M en M0), date de course.
- `Availability` / `AvailabilityException` — semaine type + exceptions
  ponctuelles.
- `TrainingZones` — zones FC / puissance / allure, par discipline.
- `TrainingPlan` → `TrainingPhase` → `TrainingWeek` → `PlannedSession`.
- `CompletedSession`, `SessionFeedback` — ce qui a été réellement fait et
  ressenti (voir M0.7).
- `ReadinessCheck` — check-in pré-séance (fatigué / normal / très bien en M0).
- `AdaptationDecision` — sortie du moteur d'adaptation.
- `FitnessMetrics`, `TrainingHistory` — séries temporelles dérivées.

Les noms peuvent évoluer si l'architecture l'exige, mais la distinction
**PLANNED vs COMPLETED** est structurante et ne change pas.

## Catalogue de séances (`sports/triathlon/sessions`)

Les séances sont composées de **blocs réutilisables** (échauffement,
répétitions structurées avec cible et récupération, retour au calme), pas de
textes libres. Catégories couvertes en M0.3 :

- **Natation** : technique, endurance, CSS, seuil, intervalles, récupération.
- **Vélo** : endurance, tempo, sweet spot, seuil, VO2max, sortie longue,
  récupération.
- **Course** : facile, longue, tempo, seuil, intervalles, récupération.
- **Renforcement**, **mobilité**, **brick**, **transitions**.

Un bloc porte toujours : durée ou distance, cible (zone / %FTP / allure /
RPE), et récupération le cas échéant — jamais de nombre magique en dur dans
le code de génération, toujours une constante nommée.

Les types de séance utilisés comme ancre d'une phase (sortie longue, sweet
spot, seuil, CSS, tempo) existent en plusieurs **paliers** (`SessionTier` —
voir "Progression au sein d'une phase" ci-dessous), qui portent la
progression et la diversification réelles d'une semaine à l'autre.

## Générateur de plan (`sports/triathlon/planning`)

Construit le cycle **à rebours depuis la date de course** :

1. Calcule le nombre de semaines disponibles.
2. Répartit les phases (base / développement / spécifique / affûtage /
   course) proportionnellement au temps disponible et à la distance visée
   (`phaseAllocation.ts`).
3. Pour chaque semaine, place la séance clé (sortie longue, séance de
   qualité) sur le créneau le plus adapté, puis les séances secondaires et
   optionnelles (`weeklySlots.ts` → `buildWeekSessions.ts`).
4. Insère les bricks / séances race-specific en phase spécifique.
5. Réduit la charge en affûtage par rapport au pic précédent (invariant
   testé, voir M0.8/M0.9).

Si la durée jusqu'à la course est incompatible avec le niveau déclaré (ex.
premier triathlon, course dans 3 semaines), le générateur ne produit pas un
plan agressif silencieux : il signale l'incohérence à l'utilisateur.

### Progression au sein d'une phase (`progressionCurve.ts`)

Une phase de plusieurs semaines n'est pas une répétition de la même
semaine : chaque semaine se voit attribuer un **multiplicateur de charge**
déterministe et documenté (pas un calcul opaque) selon sa position dans la
phase :

- **Base / développement / spécifique** : cycle de 4 semaines — deux
  semaines de charge croissante, une semaine de pointe (la plus dure du
  bloc), puis une semaine de **récupération/deload** (charge réduite
  d'environ 30 %) qui permet d'assimiler le bloc avant le suivant. C'est un
  principe classique de périodisation par blocs, pas un réglage par
  athlète.
- **Affûtage** : la charge décroît **de façon monotone** jusqu'à la course,
  quelle que soit la durée réelle de l'affûtage (1 semaine pour un Sprint,
  2 pour un "M", davantage si un délai court a forcé le générateur à
  replier plusieurs semaines dans l'affûtage par sécurité).
- **Course** : semaine volontairement très légère.

Ce multiplicateur est ensuite converti en un **palier** (`SessionTier` :
`minimal` / `reduced` / `standard` / `peak`) qui sélectionne, dans le
catalogue de séances (`sports/triathlon/sessions`), une **variante
réellement différente** de la séance clé de la phase — pas une même
séance rallongée artificiellement : moins (ou plus) de répétitions,
une structure différente. Chaque palier est un contenu authoré et
inspectable, jamais un facteur d'échelle calculé à la volée (cohérent avec
la règle « pas de fausse science »).

Pour les types les plus répétés (seuil, sweet spot, CSS, tempo, sortie
longue), le palier `standard` contient **deux structures différentes**
(continue vs fractionnée, répétitions longues vs courtes) alternées d'une
semaine sur l'autre — même charge, forme différente, pour une vraie
diversification même quand deux semaines consécutives restent au même
palier.

### Séances secondaires : rotation en développement/spécifique (`weeklySlots.ts`)

En développement et en spécifique, la séance secondaire d'une discipline
(vélo/course/natation) suit une **rotation sur 4 semaines** plutôt qu'un
type unique répété : endurance facile → sortie longue → séance VO2max/
fractionné → endurance facile. Sans cette rotation, l'exposition à la
sortie longue disparaissait après la phase base et le catalogue de séances
VO2max/fractionné n'était jamais réellement utilisé par le générateur,
malgré son existence — un manque par rapport à un entraînement polarisé
réel (volume facile + un ou deux stimulus intenses, pas uniquement du
"seuil mou" chaque semaine). Sur une semaine de deload/affûtage, la
rotation est désactivée : la séance secondaire redevient le choix calme par
défaut, cohérent avec l'objectif d'une semaine de récupération.

## Écran central : Aujourd'hui

Le moteur de coaching (`engine/coach`) répond chaque jour à trois questions :
**Que faire ? Comment ? Pourquoi ?** — countdown course, séance du jour,
objectif, structure, cibles précises, et la phrase d'explication contextuelle
("pourquoi cette séance aujourd'hui").
