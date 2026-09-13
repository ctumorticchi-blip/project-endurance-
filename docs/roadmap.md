# Roadmap

Vision complète pour comprendre la direction du produit. **M0 est le seul
mandat d'exécution actuel** — M1+ décrit l'intention, pas un engagement
d'implémentation immédiate.

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

**Stop gate atteint** : M0.12 est terminé (122 tests passants, build
vérifié, 4 scénarios de simulation, QA mobile/tablette/desktop et
accessibilité, persistance vérifiée). Voir le rapport final du projet pour
le détail complet, les limites connues et le blocage réseau sur le
déploiement Vercel. Le projet s'arrête ici pour évaluation humaine avant
toute M1.

## M1 — Excellent produit (intention, non planifiée)

Design system définitif, Today 2.0, Session Player 2.0, Plan 2.0
(vues semaine/mois), analytics, narration du coach améliorée, onboarding
premium, PWA, QA accessibilité approfondie.

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

## M10 — Endurance Platform

Un utilisateur peut avoir successivement un objectif running, puis
triathlon, puis trail, sans changer d'écosystème : historique unifié,
profil athlète, performances, zones, disponibilités, Coach Engine et
données connectées partagés entre sports.
