# Running Engine

Ce document décrit le module `sports/running/` (catalogue de séances,
générateur de plan) ajouté par le rollout M6 (Multisport — voir
`roadmap.md`). Pour les méthodologies d'entraînement citées, voir
`running-coaching-methodology.md`. Pour le moteur triathlon d'origine, voir
`training-engine.md` — les deux partagent la même architecture en couches
et une bonne partie de leur code, décrit ci-dessous.

## Principe : un sport de plus, pas un produit à part

`RaceGoal` et `AthleteProfile` sont des **unions discriminées sur
`sport`** (`'triathlon' | 'running'`) plutôt que deux domaines séparés :
`TriathlonRaceGoal` et `RunningRaceGoal` partagent une base commune
(`id`, `raceDate`, `raceName`, `createdAt`) et ne divergent que sur ce qui
change réellement — la distance. `core/goals/raceGoalDisplay.ts` est le
seul endroit qui doit distinguer les deux pour un label ou une durée
minimale recommandée ; tout le reste du domaine (`TrainingPlan`,
`TrainingWeek`, `PlannedSession`, `WorkoutBlock`) était déjà indépendant du
sport et n'a pas changé.

## Ce qui est réutilisé tel quel

Le moteur de charge/progression (`engine/metrics/load.ts`,
`sports/triathlon/planning/progressionCurve.ts`) et le modèle de bloc/séance
(`sports/triathlon/sessions/common.ts` — `WorkoutBlock`, `SessionTemplate`,
`SessionTier`, `instantiateSessionTemplate`) sont **importés directement**
par `sports/running/`, pas dupliqués : ils n'avaient aucune hypothèse
triathlon (RPE, zones, paliers minimal/reduced/standard/peak s'appliquent
à n'importe quel sport). Le moteur d'adaptation (`engine/adaptation/`) est
lui aussi inchangé — une séance de course adaptée par un check-in de
fatigue suit exactement le même chemin qu'une séance vélo ou natation.

## Ce qui est dupliqué délibérément

`sports/running/planning/pickTemplate.ts` est une copie volontaire du
petit algorithme de correspondance (type préféré → palier → repli) de
`sports/triathlon/planning/pickTemplate.ts`, plutôt qu'un refactor de la
version triathlon pour accepter des candidats injectés. Coût : une
duplication mineure et assumée. Bénéfice : risque zéro sur le code
triathlon déjà testé et livré. Si les deux copies divergent un jour, c'est
une divergence explicite et inspectable, pas un bug.

## Catalogue de séances (`sports/running/sessions/runningSessions.ts`)

Course à pied uniquement en discipline principale (`run`), plus
renforcement spécifique coureur (`strength`) et mobilité générale
(réutilisée directement du catalogue triathlon, `mobility`). ~30 templates
reprenant les `SessionType` déjà existants dans le moteur — aucun nouveau
type n'a été ajouté, donc aucun changement n'était nécessaire dans le
moteur de charge (`INTENSITY_FACTOR`) ou ailleurs :

- **Facile / récupération** (`recovery`, `endurance`) — la base aérobie,
  avec une variante "+ lignes droites" (strides) pour l'entretien
  neuromusculaire sans vraie séance de vitesse.
- **Sortie longue** (`long`) — 4 paliers (minimal/reduced/standard/peak) et
  3 variantes standard : classique, finish rapide, bloc allure course.
- **Tempo** (`tempo`) — tempo continu et fartlek (jeu de vitesse), en
  rotation.
- **Seuil** (`threshold`) — répétitions longues et courtes, en rotation.
- **VO2max** (`intervals`) — 1000m, 400m et côtes, en rotation à trois.
- **Allure de course** (`race-specific`) — un tune-up court pour 5K/10K,
  un bloc continu pour semi/marathon.

Voir `running-coaching-methodology.md` pour la justification de chaque
structure.

## Générateur de plan (`sports/running/planning/`)

Même squelette race-backwards que le générateur triathlon
(`generateRunningPlan.ts` mirrors `generateTrainingPlan.ts`), sur deux
briques propres à la course à pied :

### Allocation des phases par distance (`phaseAllocation.ts`)

Contrairement au triathlon (un seul ratio base/développement/spécifique),
chaque distance de course a son propre ratio, reflétant une différence
réelle et documentée entre l'entraînement marathon et l'entraînement
5K/10K (voir `running-coaching-methodology.md`) :

| Distance       | Base | Développement | Spécifique | Affûtage |
|----------------|------|----------------|------------|----------|
| 5K             | 35 % | 30 %           | 35 %       | 1 semaine |
| 10K            | 38 % | 32 %           | 30 %       | 1 semaine |
| Semi-marathon  | 42 % | 33 %           | 25 %       | 2 semaines |
| Marathon       | 48 % | 32 %           | 20 %       | 2 semaines |

Un marathon a une base aérobie plus longue et une phase spécifique plus
courte ; un 5K a l'inverse. L'algorithme de répartition proportionnelle
lui-même (`splitProportional`) est réutilisé tel quel depuis
`sports/triathlon/planning/phaseAllocation.ts` (exporté pour l'occasion) —
seuls les ratios diffèrent.

### Rôles hebdomadaires (`weeklySlots.ts`)

Le triathlon alterne les disciplines (vélo/course/natation) dans la
semaine ; un coureur n'a qu'une discipline, donc ce qui varie est le
**rôle** de chaque séance de course, pas sa discipline :

```
long → quality → quality2 → easy → easy → strength → mobility
```

(chaque rôle n'apparaît qu'une fois assez de jours sont disponibles). La
séance "quality" principale suit la même progression aérobie-d'abord que
le catalogue : aucun travail structuré dur en base, seuil en
développement, VO2max/allure de course en spécifique, tempo léger en
affûtage. Une seconde séance de qualité apparaît à partir de 5 jours
disponibles et tourne (tempo/seuil/VO2max/allure course) sur une semaine
normale-ou-plus, sans rotation sur une semaine de deload.

## Onboarding et écrans (RUN-4/RUN-5)

Le flux d'onboarding garde le même tableau de 6 étapes pour les deux
sports (`ONBOARDING_STEPS` ne change jamais de longueur) ; chaque étape
adapte son contenu à `draft.sport` en interne plutôt que d'ajouter ou
retirer une étape — ce qui évite tout décalage d'index si l'athlète change
de sport après avoir avancé. `submitOnboarding.ts` construit le bon
`AthleteProfile`/`RaceGoal` et appelle `generateTrainingPlan` ou
`generateRunningPlan` selon `draft.sport`.

Un plan course à pied n'a pas d'échange de discipline pertinent
(`SwapSessionControl` avec `allowDisciplineSwap={false}` n'offre que la
conversion en repos), pas de piscine à déclarer dans les disponibilités, et
pas de FTP/CSS à calibrer sur le profil.
