# Roadmap

Vision complète pour comprendre la direction du produit. **M0 et M1 sont
les mandats d'exécution réalisés** — M2+ décrit l'intention, pas un
engagement d'implémentation immédiate.

## M0 — Le coach fonctionne (terminé, en attente d'évaluation humaine)

Objectif : prouver que le moteur de coaching triathlon adaptatif fonctionne
réellement, de bout en bout, sans montre connectée. **M0.0 à M0.12 sont
terminés** — voir le rapport final pour le détail et les limites connues.

| # | Milestone | Contenu | Statut |
|---|---|---|---|
| M0.0 | Foundation | Repo, stack, architecture, routing, branding, storage abstraction, tests, docs | ✅ |
| M0.1 | Onboarding | Profil, objectif Sprint/M, date course, niveaux, disponibilités, métriques connues | ✅ |
| M0.2 | Training domain | Disciplines, phases, zones, sessions, charge, feedback, historique | ✅ |
| M0.3 | Session catalog | Bibliothèque de séances structurées en blocs (swim/bike/run/strength/mobility/brick) | ✅ |
| M0.4 | Plan generator | Périodisation à rebours depuis la date de course | ✅ |
| M0.5 | Today | Écran central : séance du jour, objectif, structure, pourquoi, check-in | ✅ |
| M0.6 | Session player | Lecteurs par discipline : blocs, chrono, répétitions, récupérations, cibles | ✅ |
| M0.7 | Completed + feedback | Planned vs completed, RPE, ressenti, historique | ✅ |
| M0.8 | Adaptation engine v1 | KEEP/REDUCE/INCREASE/MOVE/REPLACE/REMOVE avec reason codes et tests | ✅ |
| M0.9 | Dynamic scheduling | Exceptions de disponibilité, séances ratées, pas de dette d'entraînement | ✅ |
| M0.10 | Calibration | FTP/CSS/seuil, tests terrain, recalibration expliquée | ✅ |
| M0.11 | Progress | Historique, charge, régularité, tendances, "ce que j'ai appris" | ✅ |
| M0.12 | QA + Release Candidate | Simulations, QA mobile/a11y/persistance, déploiement, rapport final | ✅ (déploiement bloqué — voir rapport) |

**Stop gate M0 atteint** : M0.12 est terminé (122 tests passants, build
vérifié, 4 scénarios de simulation, QA mobile/tablette/desktop et
accessibilité, persistance vérifiée). Voir le rapport final du projet pour
le détail complet, les limites connues et le blocage réseau initial sur le
déploiement Vercel (depuis résolu, voir `docs/m0-final-report.md`).

## M1 — Excellent produit (terminé)

Objectif : partant d'un coach qui fonctionne (M0), le rendre agréable,
explicable et installable — sans jamais réintroduire de fausse précision
ni de dette d'accessibilité au passage.

| # | Milestone | Contenu | Statut |
|---|---|---|---|
| M1.0 | Design system | Tokens (couleurs/typo/espacement/rayons) synchronisés `brand.ts` ↔ `index.css`, primitives partagées (`Card`, `Badge`, `StatTile`, `Field`, `Button`/`LinkButton`, `ChoiceGroup`) | ✅ |
| M1.1 | Today 2.0 | `RaceCountdown`, `CoachInsight` (fusionne explication + adaptation), 2 vrais bugs de contraste trouvés et corrigés via axe-core | ✅ |
| M1.2 | Session Player 2.0 | `ProgressBar` (séance + étape), aperçu de l'étape suivante, badge de pause, correction du token `text-faint` (cassé sur les 4 fonds de l'app) | ✅ |
| M1.3 | Plan 2.0 | Semaines repliables (seule la semaine en cours est ouverte par défaut), badge "Cette semaine", priorité affichée par séance | ✅ |
| M1.4 | Analytics | Volume hebdomadaire réel (zéros compris) sur 6 semaines, volume par discipline en barres proportionnelles — un seul graphique, pas de dashboard | ✅ |
| M1.5 | Coach explanations | `AdaptationDecisionCard` (type + "avant → après" + justification) partagé entre l'écran séance manquée et l'historique Progrès ; correction de l'alpha des `Badge` (échouait sur `surface-raised`) | ✅ |
| M1.6 | Onboarding premium | Écran de bienvenue (valeur, durée estimée), orientation visible "Étape X/Y · Titre" | ✅ |
| M1.7 | PWA | `vite-plugin-pwa`, icônes générées, app installable et fonctionnelle hors-ligne après une première visite, correction `lang="en"` → `"fr"` | ✅ |
| M1.8 | Accessibility + QA | Suite Playwright + `@axe-core/playwright` (`npm run test:e2e`, 21 scénarios) : zéro violation WCAG 2A/2AA sur tout l'écran réel de l'app | ✅ |

**Stop gate M1 atteint** : M1.0 à M1.8 terminés, `npm run check` vert (135
tests) et `npm run test:e2e` vert (21 scénarios, zéro violation
axe-core). Chaque milestone a été vérifié dans un vrai navigateur avant
commit — pas seulement par lecture de code — et plusieurs bugs réels
(contraste, token cassé, `lang` incorrect) ont été trouvés et corrigés de
cette façon plutôt que supposés absents.

## M2 — Cloud & Account

Authentification, backend/base de données (Supabase envisagé si toujours
pertinent au moment de l'implémentation), stockage cloud, sync multi-device,
comptes, sauvegardes, migration local→cloud, export/suppression de données.

## M3 — Connected Athlete

Import d'activités (Strava puis Garmin en priorité, puis Apple Health /
Health Connect / COROS / Wahoo / Suunto), normalisation, association
activité réelle ↔ séance prévue, signaux de feedback automatiques.

## M4 — Coach Intelligence V2

Baseline athlète, tendances de forme et de fatigue, qualité de séance,
équilibre des disciplines, indicateur de "race readiness" sans fausse
précision, recalibration automatique, charge adaptative, recommandations
explicables, puis coach en langage naturel :

```
USER → AI COACH → STRUCTURED INTENT → COACH ENGINE
     → VALIDATED ACTION → PLAN CHANGE → EXPLANATION
```

Le LLM comprend, reformule et explique ; il n'a jamais le pouvoir de
modifier arbitrairement la programmation — c'est le moteur qui décide des
actions autorisées.

## M5 — Business

Monétisation uniquement après validation réelle du produit : pricing
research, modèle d'entitlement, paywall, Stripe, essai gratuit,
abonnements, analytics de rétention. Modèle envisagé : Free (aperçu, plan
limité) vs Premium (adaptation complète, métriques avancées, données
connectées, coach insights).

## M6–M9 — Multisport

Running (M6) → Cycling (M7) → Swimming (M8) → Trail (M9), chacun réutilisant
Athlete Model / Coach Engine / Metrics Engine / Storage / Account /
Analytics / Connected Data, en ne dupliquant que la logique spécifique au
sport.

**M6 — Running : livré.** `RaceGoal`/`AthleteProfile` sont des unions
discriminées sur `sport` ; `sports/running/` a son propre catalogue de
séances, son propre générateur de plan (périodisation spécifique par
distance 5K/10K/semi/marathon) et son propre onboarding, en réutilisant
directement le moteur d'adaptation, le modèle de séance/bloc et le moteur
de charge existants — voir `docs/running-engine.md` (architecture) et
`docs/running-coaching-methodology.md` (méthodologies sources). Cycling et
Swimming (M7/M8) suivront le même schéma une fois Running validé en
conditions réelles.

## Training Intelligence V2 — qualité de coaching triathlon (terminé)

Réalisé après M6 (Running), avant la poursuite du multisport (M7+) :
recentrage volontaire sur la **qualité de la programmation triathlon**
plutôt que sur de nouvelles fonctionnalités — brief : "ne génère pas un
calendrier de séances, prescris une progression de stimuli". Voir
`docs/coaching-methodology.md` pour le pipeline complet.

| Phase | Contenu | Statut |
|---|---|---|
| A | Audit du moteur existant contre le nouveau brief | ✅ |
| B | Modèle de domaine : classification de preuves, types de base V2 | ✅ |
| C | Modèle athlète V2 par discipline (déjà en place, étendu) | ✅ |
| D | Architecture Workout Family (`docs/workout-families.md`) | ✅ |
| E | Moteur de progression : 5 décisions, échelles (`docs/progression-engine.md`) | ✅ |
| F | Weekly Stimulus Composer (`docs/weekly-composer.md`) | ✅ |
| G | Câblage du composer dans le générateur triathlon + système de séances clé | ✅ |
| H | Modèle d'intensité : intention vs. mesure (`docs/intensity-model.md`) | ✅ |
| I | Moteur de réponse athlète + intégration adaptation/affûtage/vie réelle | ✅ |
| J | Athlète Gold Standard 16 semaines + matrice de 15 scénarios de benchmark (`docs/gold-standard.md`) — 3 défauts de coaching réels trouvés et corrigés (voir le Coaching Defect Log) | ✅ |
| K | UX minimale : pourquoi cette semaine, pourquoi cette progression | ✅ |
| L | Documentation complète | ✅ |
| M | Quality gate final, QA navigateur, rapport final | ✅ |

**Stop gate atteint** : aucune nouvelle fonctionnalité au-delà de ce
périmètre (pas de refonte visuelle, pas de fonctionnalité sociale, pas de
chat IA, pas d'intégration Garmin/Strava) tant que ce milestone n'a pas été
revu.

## M10 — Endurance Platform

Un utilisateur peut avoir successivement un objectif running, puis
triathlon, puis trail, sans changer d'écosystème : historique unifié,
profil athlète, performances, zones, disponibilités, Coach Engine et
données connectées partagés entre sports.
