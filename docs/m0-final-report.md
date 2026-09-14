# Project Endurance — M0 Final Report

## 1. Repository

`ctumorticchi-blip/project-endurance-` (private). Created fresh for this
project this session — see §25 for confirmation that no existing repo was
touched. Default branch: `main`.

## 2. Production URL

**https://project-endurance-ugno.vercel.app/** — live and confirmed working.

This session could not create the Vercel project itself: every attempt
via `vercel deploy` (authenticated and `--temporary` anonymous modes) had
`api.vercel.com` rejected by this session's network egress policy (`403`
at the proxy layer, confirmed via `curl $HTTPS_PROXY/__agentproxy/status`
— recorded `connect_rejected` entries for `api.vercel.com:443`). The
Vercel project was instead connected to the GitHub repo directly by the
user, outside this session, with default static-site settings.

That first deployment built successfully but returned Vercel's static
404 on any non-root path (e.g. `/today`) — expected for a client-side-routed
SPA with no rewrite rule: the router never gets a chance to resolve the
route because Vercel looks for a matching file first. Fixed by adding
`vercel.json` with a catch-all rewrite to `index.html` (commit
`2855afd`); the next auto-triggered deployment resolved it, confirmed by
the user. I still cannot fetch this URL myself from inside this session
(`project-endurance-ugno.vercel.app` is also rejected by the egress
policy) — verification is by the user's own report, not a tool call.
once network access exists.

## 3. Final SHA

`2855afd0645dc876f17f019d70f658b3e8c11f67`

## 4. Architecture finale

React 19 + TypeScript strict + Vite 8 + React Router 7 + Tailwind CSS 4 +
Vitest 5 + Testing Library + ESLint 10. Local-first persistence via a
`StorageAdapter` interface (`LocalStorageAdapter` today) with versioned
records, ready for a future `CloudStorageAdapter` without touching
callers. The coaching engine (`engine/`) is plain TypeScript, entirely
independent of React — every generator/adaptation function is called
directly from tests with no component mounted. See `docs/architecture.md`
(kept up to date across the build) for the full rationale, including the
one documented exception to sport-independence (`RaceGoal` referencing
`TriathlonDistance` directly — YAGNI, single sport in M0).

## 5. Structure principale

```
src/
  app/        router, RootLayout (bottom nav), FocusedLayout (full-screen flows), onboarding gate
  config/     brand.ts — single source of truth for product identity
  core/       athlete/ goals/ availability/ training/ history/ — sport-agnostic domain + repositories
  engine/     coach/ planning-support/ adaptation/ calibration/ metrics/ history/ — pure business logic
  sports/
    triathlon/
      domain/     TriathlonDistance
      planning/   phase allocation, weekly slot assignment, template picking, the plan generator
      sessions/   the session catalog (swim/bike/run/strength/mobility/brick templates)
  features/   onboarding/ today/ plan/ session-player/ feedback/ calibration/ profile/ progress/
  shared/     storage/ types/ utils/ hooks/ components/
  simulation/ end-to-end scenario tests
```

## 6. Features terminées

Toutes les features listées M0.0 → M0.12 dans `docs/roadmap.md` sont
implémentées et testées : onboarding, domaine d'entraînement, catalogue de
séances, générateur de plan, écran Aujourd'hui, lecteur de séance,
feedback complété/raté, moteur d'adaptation (6 décisions), planification
dynamique (exceptions, séances ratées, pas de dette), calibration (FTP/
CSS/seuil), page Progrès.

## 7. Parcours utilisateur

Les 30 points de la Definition of Done (brief §56) sont couverts et
vérifiés dans un vrai navigateur (Playwright, 390px) au fil du build :
ouverture → profil → Sprint/M → date de course → niveau → disponibilités
→ métriques connues → programme complet → séance du jour → pourquoi →
cibles → lecteur de séance → blocs → complétion → RPE/ressenti → séance
ratée + raison → modification ponctuelle de disponibilité → recalcul
visible → priorités respectées → explication du changement → historique
→ progression → recalibration FTP/CSS/seuil → refresh sans perte de
données → mobile → jusqu'à la race week → fin de cycle cohérente.

Non couvert manuellement : le tout dernier jour réel de course (le plan
s'arrête correctement avant la date de course — vérifié par test — mais
je n'ai pas simulé "arriver à J0" dans le navigateur, seulement en test).

## 8. Training Engine

Modèle générique (`core/training`) : `WorkoutBlock` → `PlannedSession` →
`TrainingWeek`/`TrainingPhase` → `TrainingPlan`. Le générateur
(`sports/triathlon/planning/generateTrainingPlan.ts`) construit le
programme à rebours depuis la date de course : allocation des phases
(base/développement/spécifique/affûtage/course) proportionnelle aux
semaines disponibles, avec taper 1 semaine (Sprint) ou 2 semaines
(Olympique), puis assignation hebdomadaire des séances selon le nombre de
jours disponibles (1 à 7), l'accès piscine, et la phase — avec dégradation
progressive vers des séances plus faciles quand le temps manque plutôt que
de dépasser la disponibilité déclarée.

## 9. Session Catalog

24 templates couvrant natation (6), vélo (7), course (6), renforcement
(1), mobilité (1), brick/transitions (3). Chaque template est composé de
blocs réutilisables (échauffement, séries, récupération, retour au calme)
avec cible RPE + zone relative, jamais de texte libre.

## 10. Plan Generator

Voir §8. Testé par 13 tests unitaires (`phaseAllocation`,
`buildWeekSessions`, `generateTrainingPlan`) plus les 4 scénarios de
simulation de bout en bout (§17).

## 11. Adaptation Engine

`engine/adaptation/decideAdaptation.ts` implémente les 6 décisions (KEEP,
REDUCE, INCREASE, MOVE, REPLACE, REMOVE) avec reason codes, before/after
et une explication prête pour l'UI. Deux modes : séance à venir
(readiness + tendance RPE sur fenêtre ≥2 points, jamais un seul signal) et
séance ratée (douleur → REMOVE + recommandation professionnelle sans
diagnostic ; priorité optionnelle/secondaire → REMOVE ; séance clé → MOVE
vers le premier créneau libre, sinon REPLACE raccourcie). Une règle
séparée (`decideAvailabilityConstraint`) gère l'ajustement ponctuel de
disponibilité. Chaque décision est journalisée
(`AdaptationDecisionRepository`) et effectivement appliquée au plan stocké
(les blocs sont recalculés proportionnellement, pas seulement la durée
affichée). 27 tests dédiés + vérification en navigateur réel (réduction
70→60min sur fatigue, 70→20min sur disponibilité réduite, remplacement
d'une séance clé ratée).

## 12. Calibration

Trois tests de terrain documentés comme des approximations standards (pas
des mesures de laboratoire) : FTP (test 20 minutes, 95 % de la puissance
moyenne), CSS (400m + 200m, allure déduite de l'écart), seuil course
(distance parcourue en 20 minutes). Chaque test met à jour le profil et
recalcule immédiatement les zones affichées sur le profil.

## 13. Metrics

Zones HR/puissance/allure calculées uniquement quand la métrique connue
existe (jamais de nombre inventé). Charge relative documentée et
décomposable (`engine/metrics/load.ts`) — explicitement pas un TSS
certifié. Voir `docs/metrics.md`.

## 14. Persistence

`localStorage` via `StorageAdapter`, chaque enregistrement versionné
(`VersionedRecord` + migrations chaînées, testées). Vérifié : refresh sur
Aujourd'hui/Programme/Progrès/Profil ne perd aucune donnée (Playwright).

## 15. Explicability system

Chaque décision d'adaptation porte des reason codes + une explication en
langage naturel affichée immédiatement (bannière sur Aujourd'hui, écran de
résultat pour une séance ratée). La page Progrès republie les décisions
récentes et une synthèse "Ce que j'ai appris" honnête (jamais de tendance
fabriquée avec trop peu de données).

## 16. Tests

**122 tests, 26 fichiers, tous passants.** Répartition approximative :
domaine/storage (~25), calibration/zones (~20), catalogue de séances (~9),
génération de plan (~20), adaptation (~30), UI de features (~13),
simulations de bout en bout (5). Commande : `npm run test`.

## 17. Simulation results

4 scénarios (`src/simulation/scenarios.test.ts`), tous verts :

- **A** Sprint, intermédiaire, ~12 semaines, 5 séances/semaine : plan
  généré, séance clé ratée puis signal de fatigue — invariants tenus après
  chaque événement.
- **B** Olympique ("M"), intermédiaire, ~20 semaines, 6 séances/semaine :
  taper 2 semaines confirmé plus léger que le pic, signal de forme positive
  jamais traduit en régression.
- **C** Premier Sprint, faible volume, 6 semaines de délai (< minimum
  recommandé) : avertissement émis, aucune semaine ne présente un pic de
  charge disproportionné (ratio max/min < 4).
- **D** Disponibilités contraintes (jour indisponible + jour réduit en
  cours de cycle) : les deux exceptions sont respectées sans dette
  d'entraînement.

## 18. Mobile QA

Testé en navigateur réel (Playwright/Chromium) à 390px (mobile), 768px
(tablette) et 1280px (desktop) : aucun débordement horizontal à aucune
largeur. Un bug de layout (les flux plein écran — onboarding, lecteur de
séance, feedback — s'étiraient bord à bord sur desktop) a été détecté
lors de cette QA et corrigé (`FocusedLayout`).

## 19. Accessibility QA

Scan automatisé axe-core (règles WCAG 2A + 2AA) sur les 11 écrans
principaux (chaque étape de l'onboarding, Aujourd'hui, Programme, Progrès,
Profil, lecteur de séance) : **zéro violation**. Le formulaire s'appuie
sur des éléments natifs (`fieldset`/`legend`, `input type=radio/checkbox`,
labels associés) plutôt que sur des rôles ARIA reconstruits à la main.

## 20. Build

`npm run build` (tsc -b && vite build) réussit à chaque milestone.
Résultat final : ~384 kB JS (117 kB gzippé), ~13 kB CSS (3,5 kB gzippé).
`npm run check` (typecheck + lint + test + build) est vert sur le SHA
final.

## 21. Known limitations

- **Déploiement** : en production sur Vercel (voir §2), mais jamais vérifié
  par un outil depuis cette session — `project-endurance-ugno.vercel.app`
  est lui aussi bloqué par la politique réseau de cet environnement.
  Confirmé fonctionnel uniquement par retour direct de l'utilisateur.
- **Session player** : chronomètre uniquement (pas de saisie GPS/capteur en
  direct), cohérent avec le principe "M0 fonctionne sans montre connectée"
  mais signifie que les métriques réalisées (FC, puissance, allure) sont
  saisies a posteriori dans le formulaire de feedback pour la durée
  seulement — pas de champs distance/FC/puissance dans
  `CompletedFeedbackPage` malgré leur présence dans le modèle
  `CompletedSession` (dette technique, voir §22).
- **Un seul repas/plan actif** : pas de gestion multi-plans (ex. changer
  d'objectif de course) — recréerait un plan depuis zéro sans historiser
  l'ancien.
- **Détection de l'écart de disponibilité** (`detectAvailabilityGap`) est
  implémentée et testée mais n'a pu être observée qu'en test unitaire —
  jamais déclenchée en usage réel faute d'historique suffisant en session
  de démonstration.

## 22. Technical debt

- `CompletedFeedbackPage` ne collecte que la durée réelle ; les champs
  optionnels du modèle `CompletedSession` (distance, FC, puissance,
  cadence, SWOLF...) existent dans le type mais n'ont pas d'UI de saisie.
  Prochaine étape naturelle si des données de capteur doivent être
  saisies manuellement avant l'intégration Strava/Garmin (M3).
- Le "Plan" affiche une liste simple, pas de vue semaine/mois avec
  visualisation de phase (prévu explicitement pour M1.3, pas M0).
- Pas de tests de composants Playwright automatisés dans la suite CI
  (`npm run test`) — la QA navigateur de ce rapport a été faite
  manuellement via des scripts ad hoc, non committés au repo. À
  formaliser si l'équipe veut les rejouer en CI.

## 23. Risks

- Le modèle "charge relative" (`engine/metrics/load.ts`) est une
  heuristique documentée, pas un score validé scientifiquement — à
  garder en tête si des décisions produit s'appuient dessus plus tard.
- Aucune limite n'empêche un utilisateur de déclarer un objectif de
  course dans le passé ou à J0 exact — la fonction `daysUntilRace` gère
  bien le cas (clampé à 0) mais l'UX ne prévient pas explicitement ce
  cas d'usage improbable.
- Le blocage réseau sur `api.vercel.com` et `*.vercel.app` est spécifique
  à cet environnement d'exécution ; un futur agent dans un environnement à
  la politique réseau différente devrait retenter l'accès plutôt que
  supposer un blocage permanent — l'app elle-même est bien déployée et
  fonctionnelle, seule la vérification outillée depuis cette session est
  impossible.

## 24. Recommendations before M1

1. Faire vérifier `project-endurance-ugno.vercel.app` par un outil
   externe à cette session (CI, un autre environnement) pour avoir une
   confirmation autre que le retour verbal de l'utilisateur — et
   envisager un nom de projet Vercel définitif plutôt que le suffixe
   auto-généré `-ugno`.
2. Faire tester le parcours complet par un vrai triathlète (pas seulement
   des scénarios simulés) pour valider la pertinence sportive du
   catalogue de séances et du rythme de progression.
3. Décider si `CompletedFeedbackPage` doit gagner des champs de saisie
   manuelle (distance/FC/puissance) avant M1, ou si cela attend
   l'intégration Strava/Garmin de M3.
4. Avant M1.0 (design system), consolider `src/config/brand.ts` avec une
   identité visuelle définitive plutôt que la palette de travail actuelle.

## 25. Confirmation

**`ctumorticchi-blip/rich-racer` n'a été ni lu (au-delà de l'inspection
initiale de son historique pour vérifier qu'il s'agissait bien d'un
produit différent), ni modifié, ni poussé pendant cette session.** Tout
le travail de Project Endurance a été fait exclusivement dans
`ctumorticchi-blip/project-endurance-`, un dépôt distinct créé pour ce
projet, avec son propre historique Git.
