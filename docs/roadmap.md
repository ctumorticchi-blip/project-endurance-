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

## M10 — Endurance Platform

Un utilisateur peut avoir successivement un objectif running, puis
triathlon, puis trail, sans changer d'écosystème : historique unifié,
profil athlète, performances, zones, disponibilités, Coach Engine et
données connectées partagés entre sports.
