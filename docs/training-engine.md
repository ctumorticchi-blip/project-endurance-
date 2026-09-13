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

## Générateur de plan (`sports/triathlon/planning`)

Construit le cycle **à rebours depuis la date de course** :

1. Calcule le nombre de semaines disponibles.
2. Répartit les phases (base / développement / spécifique / affûtage /
   course) proportionnellement au temps disponible et à la distance visée.
3. Pour chaque semaine, répartit volume et intensité par discipline
   selon la phase, le niveau déclaré et les disponibilités.
4. Place les séances clés (sortie longue, séance de qualité) sur les
   créneaux disponibles les plus adaptés, puis le reste.
5. Insère les bricks / séances race-specific en phase spécifique et
   d'affûtage.
6. Réduit la charge en affûtage par rapport au pic précédent (invariant
   testé, voir M0.8/M0.9).

Si la durée jusqu'à la course est incompatible avec le niveau déclaré (ex.
premier triathlon, course dans 3 semaines), le générateur ne produit pas un
plan agressif silencieux : il signale l'incohérence à l'utilisateur.

## Écran central : Aujourd'hui

Le moteur de coaching (`engine/coach`) répond chaque jour à trois questions :
**Que faire ? Comment ? Pourquoi ?** — countdown course, séance du jour,
objectif, structure, cibles précises, et la phrase d'explication contextuelle
("pourquoi cette séance aujourd'hui").
