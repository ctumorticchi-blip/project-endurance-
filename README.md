# Project Endurance

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

122 tests (26 fichiers) au moment du rapport final de M0. Le moteur
(`engine/`, `sports/*/planning`, `sports/*/sessions`) est significativement
plus testé que l'UI décorative — voir la stratégie de test dans
`docs/adaptation-engine.md` (invariants) et les fichiers `*.test.ts(x)`
colocalisés avec le code qu'ils couvrent. `src/simulation/scenarios.test.ts`
fait tourner des scénarios athlète réalistes de bout en bout (§57 du brief
produit) plutôt que de tester une fonction isolément.

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

**M0 — Le coach fonctionne — terminé** (M0.0 à M0.12, voir `docs/roadmap.md`
pour le détail milestone par milestone). Le projet s'arrête ici pour
évaluation humaine avant toute considération de M1 — voir
`docs/m0-final-report.md` pour le bilan complet et les limites connues.
