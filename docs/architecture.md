# Architecture

## Règle majeure

**La logique sportive ne doit pas dépendre de React.** Le moteur de coaching
(génération de plan, adaptation, calcul de zones, évaluation de séance) est
composé de fonctions métier indépendantes de l'UI, pures autant que possible,
et testables sans monter un seul composant. React consomme ce moteur, il ne
le contient pas.

## Stack

- React 19 + TypeScript strict (pas de `any`)
- Vite 8 (build, dev server)
- React Router 7 (routing client, mobile-first)
- Tailwind CSS 4 (utility-first, thème centralisé dans `src/index.css` et
  `src/config/brand.ts`)
- Vitest 5 + Testing Library (tests unitaires et de composants)
- ESLint 10 + typescript-eslint (qualité de code)

## Structure des dossiers

```
src/
  app/            Shell applicatif : router, layout racine, navigation
  config/         Configuration centralisée (branding, constantes globales)
  core/           Modèles transverses : athlète, objectifs, disponibilités
    athlete/
    goals/
    availability/
  engine/         Moteur de coaching, indépendant de React et du sport
    coach/        Orchestration : décide quoi montrer/faire aujourd'hui
    planning/     Génération de plan (périodisation à rebours)
    adaptation/   Moteur d'adaptation (KEEP/REDUCE/INCREASE/MOVE/REPLACE/REMOVE)
    metrics/      Charge, tendances, calculs dérivés
    calibration/  FTP / CSS / seuil course, tests terrain
    recovery/     Fatigue, readiness
    history/      Historique d'entraînement, apprentissage de la disponibilité réelle
  sports/
    triathlon/    Premier module sportif complet
      domain/     Types spécifiques triathlon
      planning/   Règles de construction de plan triathlon
      sessions/   Catalogue de séances
      swimming/ cycling/ running/ bricks/ strength/ mobility/
  features/       Écrans (composés du moteur + de l'UI)
    onboarding/ today/ plan/ session-player/ feedback/ progress/ profile/
  shared/         Code transverse réutilisable
    components/ hooks/ storage/ types/ utils/
```

Cette structure est une **direction**, pas un dogme : elle peut évoluer si
une meilleure organisation se justifie, mais la séparation
`engine ⟂ sports ⟂ features` est structurante et ne doit pas être érodée.

## Vers le multisport (préparation, pas construction)

Le triathlon est aujourd'hui codé directement sous `sports/triathlon/`. La
préparation à un futur `SportModule` générique se limite à :

- Le moteur (`engine/*`) ne référence jamais de type spécifique triathlon
  (pas de `import type { SwimSession } from '@/sports/triathlon/...'` dans
  `engine/`). Il travaille sur des types génériques (`Session`, `Discipline`,
  `TrainingWeek`, etc.) définis dans `core/` et `shared/types/`.
- Les règles *spécifiques* triathlon (répartition natation/vélo/course,
  bricks, transitions) vivent uniquement dans `sports/triathlon/`.

Nous ne construisons **pas** une abstraction `SportModule` générique
maintenant (YAGNI, §37 du brief produit) — le vrai test de cette séparation
viendra lors de l'ajout du module Running (M6).

## Persistance (M0 : local-first)

`shared/storage/StorageAdapter` définit l'interface (`get/set/remove/clear`).
`LocalStorageAdapter` est la seule implémentation M0. Chaque enregistrement
persisté est enveloppé dans un `VersionedRecord { version, data }` via
`createVersionedStore`, qui sait chaîner des migrations `fromVersion → +1`.
Cela permet d'ajouter un `CloudStorageAdapter` (M2) et de migrer le schéma
des données sans réécrire les appelants.

## Branding centralisé

Toute chaîne de marque, couleur, tagline vit dans `src/config/brand.ts`. Les
composants ne doivent jamais coder en dur « Project Endurance » — ils lisent
`brand.name`. Cela permet de renommer le produit sans grep-and-replace.

## Qualité de code

- TypeScript strict, `noUncheckedIndexedAccess`, pas de `any` (règle ESLint).
- Pas de god files, pas de nombres magiques (constantes nommées).
- Fonctions métier pures quand c'est possible ; randomness seedée si un jour
  nécessaire pour la reproductibilité des tests/simulations.
- `npm run check` = typecheck + lint + test + build. Doit passer avant tout
  commit de fin de milestone.
