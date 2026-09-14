# Project Endurance

[![CI](https://github.com/ctumorticchi-blip/project-endurance-/actions/workflows/ci.yml/badge.svg)](https://github.com/ctumorticchi-blip/project-endurance-/actions/workflows/ci.yml)

> Nom de code interne. La marque commerciale définitive n'est pas encore
> choisie — voir `src/config/brand.ts` pour l'identité centralisée.

Une plateforme de coaching sportif individuel adaptatif. Premier sport :
**triathlon**. « Ton entraînement s'adapte à ta progression, ta récupération
et ta vraie vie. »

Voir [`docs/product-vision.md`](docs/product-vision.md) pour la vision
complète, et [`docs/roadmap.md`](docs/roadmap.md) pour la trajectoire M0→M10.

## Stack

- React 19 + TypeScript strict
- Vite 8
- React Router 7
- Tailwind CSS 4
- Vitest 5 + Testing Library
- ESLint 10 + typescript-eslint

## Installation

```bash
npm install
```

## Commandes

```bash
npm run dev         # serveur de développement
npm run build        # build production (tsc -b && vite build)
npm run preview      # prévisualiser le build
npm run test         # tests (vitest run)
npm run test:watch   # tests en mode watch
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run check        # typecheck + lint + test + build (à exécuter avant tout commit de milestone)
npm run test:e2e     # Playwright + axe-core, écrans réels dans un vrai navigateur (M1.8)
```

## Architecture

```
src/
  app/       shell applicatif (router, layout)
  config/    branding et configuration centralisée
  core/      modèles transverses (athlète, objectifs, disponibilités)
  engine/    moteur de coaching indépendant de React et du sport
  sports/    modules sportifs (triathlon en M0)
  features/  écrans applicatifs
  shared/    storage, types, composants et utilitaires transverses
```

Détails complets : [`docs/architecture.md`](docs/architecture.md).

Règle structurante : **la logique sportive ne dépend jamais de React** —
`engine/` et `sports/` exposent des fonctions métier pures et testables
(`generateTrainingPlan`, `adaptTrainingWeek`, `calculateZones`,
`evaluateSession`, ...).

## Documentation

| Fichier | Contenu |
|---|---|
| [`docs/product-vision.md`](docs/product-vision.md) | Problème, promesse, cible, priorités |
| [`docs/architecture.md`](docs/architecture.md) | Stack, structure des dossiers, persistance |
| [`docs/training-philosophy.md`](docs/training-philosophy.md) | Philosophie sportive, explicabilité, sécurité |
| [`docs/training-engine.md`](docs/training-engine.md) | Modèles de données, catalogue de séances, générateur de plan |
| [`docs/adaptation-engine.md`](docs/adaptation-engine.md) | Moteur d'adaptation, reason codes, invariants |
| [`docs/metrics.md`](docs/metrics.md) | Métriques par discipline, calibration, charge |
| [`docs/roadmap.md`](docs/roadmap.md) | M0 détaillé + intention M1→M10 |
| [`docs/design-system.md`](docs/design-system.md) | Tokens, typographie, composants partagés (M1.0) |
| [`docs/m0-final-report.md`](docs/m0-final-report.md) | Bilan complet de M0 |

## Tests

Deux suites, pour deux natures de bug différentes :

- **`npm run test`** (Vitest + Testing Library + jsdom) : 135 tests au
  moment de M1.8. Le moteur (`engine/`, `sports/*/planning`,
  `sports/*/sessions`) est significativement plus testé que l'UI
  décorative — voir la stratégie de test dans `docs/adaptation-engine.md`
  (invariants) et les fichiers `*.test.ts(x)` colocalisés avec le code
  qu'ils couvrent. `src/simulation/scenarios.test.ts` fait tourner des
  scénarios athlète réalistes de bout en bout (§57 du brief produit)
  plutôt que de tester une fonction isolément.
- **`npm run test:e2e`** (Playwright + `@axe-core/playwright`, M1.8) :
  jsdom ne peint rien, donc il ne peut pas détecter un vrai échec de
  contraste WCAG — deux ont pourtant été trouvés et corrigés pendant M1
  via des scripts manuels avec un vrai Chromium. `e2e/accessibility.spec.ts`
  institutionnalise ce type de vérification : 21 scénarios (onboarding
  écran par écran, Aujourd'hui, Session Player, séance manquée,
  Programme, Progrès, Profil, tests de calibration, page introuvable),
  chacun scanné avec `axe-core` (règles `wcag2a`/`wcag2aa`) dans un
  navigateur réel. Pas inclus dans `npm run check` (plus lent, nécessite
  un navigateur) — à exécuter explicitement.

## Intégration continue

`.github/workflows/ci.yml` fait tourner les deux suites sur chaque push et
chaque pull request vers `main` : d'abord `npm run check` (typecheck, lint,
tests unitaires, build), puis, seulement si ça passe, `npm run test:e2e`
(Playwright + axe-core) avec le rapport HTML uploadé comme artefact en cas
d'échec. Objectif : un commit qui casse le build ou introduit une
régression d'accessibilité ne peut plus passer inaperçu.

## Déploiement

**https://project-endurance-ugno.vercel.app/** — build de production
Vite déployé sur Vercel (rewrite SPA configuré dans `vercel.json`).

PWA (M1.7) : `vite-plugin-pwa` précache tout le shell applicatif au build
(`npm run build` génère `dist/sw.js` + `dist/manifest.webmanifest`) — l'app
est installable et se recharge hors-ligne après une première visite,
cohérent avec le principe local-first (aucun appel réseau applicatif à
mettre en cache). Vérifié avec `vite preview` + Playwright : service worker
actif, manifest et icônes valides, rechargement réussi avec le réseau
coupé (`context.setOffline(true)`). Non re-testé sur le déploiement Vercel
lui-même — `*.vercel.app` est bloqué au niveau réseau de cet environnement
de dev — mais `sw.js`/`manifest.webmanifest`/`icons/*` sont des fichiers
statiques réels dans `dist/`, donc Vercel les sert directement (comme il le
fait déjà pour `assets/*.js`) sans passer par le rewrite SPA.

## Roadmap actuelle

**M0 — Le coach fonctionne — terminé** (M0.0 à M0.12) et **M1 — Excellent
produit — terminé** (M1.0 à M1.8 : design system, Today/Session
Player/Plan/Progress 2.0, explications du coach, onboarding premium, PWA,
QA accessibilité). Voir `docs/roadmap.md` pour le détail milestone par
milestone et `docs/m0-final-report.md` pour le bilan complet de M0.
