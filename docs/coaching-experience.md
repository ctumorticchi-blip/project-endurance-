# Coaching Experience V1

Comment Training Intelligence V2/V2.1 devient une expérience athlète —
sans jamais dupliquer sa logique de coaching dans l'UI (brief §1 : ENGINE
DECISION → STRUCTURED REASON → USER-FACING EXPLANATION, jamais l'inverse).

## Ce que l'audit a trouvé

Avant ce milestone, le moteur calculait déjà beaucoup plus qu'il n'en
montrait : les `WorkoutFamily` avaient un `trainingPurpose`/`explanation`
athlète-facing jamais affichés ; le compositeur hebdomadaire produisait des
`reasonCodes` (`ANCHOR_SESSION`, `LIMITER_DEVELOPMENT_TOUCH`, …) qui
n'atteignaient jamais `PlannedSession` ; `resolveIntensityPrescription`
(power/pace/CSS → HR → RPE) n'était appelé depuis **aucun** écran ; le
moteur de progression (`decideProgressionResponse`) produisait une
explication complète mais seul le texte brut apparaissait, sans badge de
décision ni niveau ; et `analyzeLimiters` était recalculé chaque semaine
sans jamais être montré sur le Profil ou le Plan.

À l'inverse, certaines pièces étaient déjà solides et n'ont pas été
reconstruites : `AdaptationDecision` (badge + avant/après + explication,
`AdaptationDecisionCard`), le flux de feedback post-séance
(`processSessionFeedback`), et la structure de séance de base (blocs avec
zone/RPE) existaient déjà et ont servi de modèle pour les nouveaux
composants.

## Architecture de présentation

```
SessionRequirement (composition)          WorkoutFamily (registre)
      │ reasonCodes, familyId                    │ explanation, trainingPurpose,
      ▼                                            physiologicalIntent
PlannedSession.familyId / .reasonCodes ◄───────────┘
      │
      ▼
explainSession(session) ──► SessionExplanation { headline, placementNote, trainingPurpose, physiologicalIntent }
      │
      ▼
<CoachInsight explanation={…} fallbackMessage={…} />
```

- **`core/training/PlannedSession.ts`** — deux champs optionnels ajoutés :
  `familyId?: string`, `reasonCodes?: string[]`. Seule extension du
  schéma persisté de tout ce milestone ; additive, aucune migration
  nécessaire (voir « Compatibilité des données » plus bas).
- **`sports/triathlon/sessions/common.ts`** (`instantiateSessionTemplate`)
  et **`sports/triathlon/planning/buildWeekSessions.ts`** — remplissent
  ces champs à partir du `SessionRequirement`/du gabarit réellement choisi
  (jamais le `familyId` d'origine si le gabarit a dégradé vers une famille
  plus facile — brief §21 : expliquer ce qui a réellement été livré).
- **`engine/coach/explainSession.ts`** — construit la « pourquoi cette
  séance » (brief §9) uniquement à partir de données réelles ; renvoie
  `undefined` si `familyId` est absent (plan ancien, ou sport — course à
  pied — sans Workout Family), auquel cas l'appelant retombe sur
  `session.objective` (jamais un texte fabriqué).
- **`engine/coach/explainWeekPurpose.ts`** (`explainWeekComposition`) —
  la « pourquoi cette semaine » (brief §11), dérivée du nombre réel de
  séances par discipline cette semaine + `analyzeLimiters`, jamais un
  gabarit fixe par phase seul.
- **`sports/triathlon/coaching/reasonCodeLabels.ts`** — traduit les
  `reasonCodes` du compositeur en une phrase française, jamais le code
  brut.
- **`engine/progression/progressionLabels.ts`** — labels/tons pour les 5
  décisions de progression, symétrique à `engine/adaptation/adaptationLabels.ts`.
- **`shared/utils/intensityDisplay.ts`** — appelle enfin
  `resolveIntensityPrescription` ; ne renvoie une valeur que si une
  métrique testée a réellement résolu (jamais "RPE" dupliqué avec
  lui-même).
- **`shared/utils/blockPresentation.ts`** — heuristiques de présentation
  pures (jamais une décision de coaching) : rôle d'un bloc
  (échauffement/principal/retour au calme) à partir de son libellé, et
  discipline d'un bloc de brick (vélo/transition/course) — voir « Pourquoi
  une heuristique plutôt qu'un nouveau champ » plus bas.
- **`shared/components/SessionBlockList.tsx`** — un seul renderer de
  structure de séance, réutilisé par Aujourd'hui, le détail d'un jour du
  Programme, et le Workout Player (auparavant trois implémentations
  indépendantes, légèrement divergentes).
- **`shared/components/ProgressionDecisionCard.tsx`** — badge + « niveau
  X → Y » + explication, symétrique à `AdaptationDecisionCard`.

## Vocabulaire cohérent (brief §56)

| Concept interne | Fichier | Termes athlète |
|---|---|---|
| `SessionPriority` (3 niveaux) | `shared/sessionPriorityLabels.ts` | Séance clé / Secondaire / Optionnelle |
| `SessionType` | `shared/sessionTypeLabels.ts` | Seuil, Sweet Spot, CSS, Fractionné, … — un seul mot par type, partout |
| `ProgressionDecision` | `engine/progression/progressionLabels.ts` | Progression / Maintien / Allègement / Récupération priorisée / Recalibrage conseillé |
| `AdaptationType` (préexistant) | `engine/adaptation/adaptationLabels.ts` | Inchangé / Réduit / Augmenté / Déplacé / Remplacé / Retiré |
| Reason codes du compositeur | `sports/triathlon/coaching/reasonCodeLabels.ts` | Phrases complètes, jamais le code |

Avant ce milestone, `TodayPage.tsx`, `DayDetailPage.tsx` et `WeekCard.tsx`
déclaraient chacun leur propre copie de `PRIORITY_LABELS`/`PRIORITY_TONE`
(identiques mais dupliquées trois fois) — consolidées dans
`sessionPriorityLabels.ts`.

## Pourquoi une heuristique de libellé plutôt qu'un nouveau champ (brick, échauffement)

Deux présentations demandaient de savoir "à quoi correspond ce bloc" sans
que `WorkoutBlock` porte l'information explicitement :

- **Échauffement/principal/retour au calme** : tous les gabarits qui en
  ont un les construisent via les helpers partagés `warmupBlock()`/
  `cooldownBlock()` (`sports/triathlon/sessions/common.ts`), qui fixent
  toujours le même libellé français sauf override explicite. Détecter ce
  libellé est donc fiable et n'exige aucun changement de schéma pour ~150
  gabarits existants.
- **Discipline d'un bloc de brick** : les gabarits brick nomment déjà
  systématiquement leurs blocs "Vélo …"/"Course …"/"Transition …" en
  français. Un nouveau champ `WorkoutBlock.discipline` aurait dupliqué
  cette information dans chaque gabarit brick (peu nombreux, mais un
  changement de schéma pour un besoin uniquement de présentation).

Les deux heuristiques vivent dans `shared/utils/blockPresentation.ts`,
sont pures fonctions de rendu (aucune décision de coaching), documentées
comme telles, et **jamais** appliquées à une phase où elles inventeraient
une classification incertaine (une session sans bloc reconnu reste un
rendu plat, honnête, plutôt qu'un faux regroupement).

## Ce qui reste volontairement inchangé

- Aucun LLM n'intervient dans une explication (brief §42) : chaque texte
  affiché est soit une chaîne déjà écrite dans le moteur
  (`WorkoutFamily.explanation`, `AdaptationDecision.explanation`,
  `ProgressionResponse.explanation`), soit une traduction déterministe
  d'un code (`reasonCodeLabels.ts`, les fichiers `*Labels.ts`).
- Le moteur de progression (`decideProgressionResponse`) reste une
  fonction pure non consultée par la génération de plan elle-même — la
  Page Progrès ré-exécute la même fonction déterministe sur l'état
  persisté plutôt que de dupliquer sa logique (voir la note ci-dessous sur
  la limite connue de ce découplage).
- Aucun changement de méthodologie d'entraînement (V2.1) n'a été fait pour
  simplifier l'implémentation UI (brief §65).

## Coaching Experience Defect Log (brief §64)

Défauts UX/coaching réels trouvés pendant l'implémentation et l'audit
(section 2), tous corrigés.

### 1. "Charge prévue" sur Aujourd'hui était un faux chiffre

- **Scénario** : la carte de séance du jour affichait "70 min · Charge
  prévue 70" — un second nombre à côté de la durée, qui semble être une
  vraie métrique de charge d'entraînement.
- **Mauvais comportement** : `Charge prévue` était en réalité
  `Math.round(session.estimatedDurationMin)` — la durée elle-même,
  arrondie et relabelée. Un faux repère chiffré (brief §41 : ne jamais
  fabriquer une métrique).
- **Cause racine** : reliquat d'un ancien brouillon jamais retiré.
- **Correction** : ligne supprimée ; seule la vraie durée reste affichée.
- **Test de non-régression** : couvert visuellement par la QA navigateur
  (capture Aujourd'hui) ; aucun texte "Charge prévue" ne doit plus
  apparaître nulle part dans le code (`grep` négatif effectué avant commit).

### 2. Aucune séance n'expliquait "pourquoi elle existe" à partir de vraies données

- **Scénario** : chaque séance affichait `session.objective`, un texte
  générique du gabarit catalogue (ex. "Améliorer ton efficacité de nage"),
  identique pour tous les athlètes quel que soit leur profil.
- **Mauvais comportement** : le moteur avait déjà écrit une explication
  athlète-facing riche par famille (`WorkoutFamily.explanation`,
  `trainingPurpose`, `physiologicalIntent`) et des `reasonCodes` de
  composition — aucun des deux n'atteignait jamais l'écran.
- **Cause racine** : `SessionRequirement.reasonCodes`/`familyId` étaient
  détruits à la fin du placement (`buildWeekSessions.ts`), et
  `PlannedSession` n'avait aucun champ pour les recevoir.
- **Correction** : `PlannedSession.familyId`/`.reasonCodes` (additifs) +
  `explainSession()` + `CoachInsight` mis à jour.
- **Test de non-régression** : `explainSession.test.ts` (4 tests, dont le
  cas `undefined` sans famille) ; vérifié visuellement sur Aujourd'hui,
  le détail d'un jour, et pour un plan de course à pied (sans famille —
  dégrade proprement vers `session.objective`).

### 3. "Pourquoi cette semaine" ignorait totalement le limiteur de l'athlète

- **Scénario** : le Programme affichait la même phrase pour chaque
  semaine d'une phase donnée, quel que soit l'athlète.
- **Mauvais comportement** : `explainWeekPurpose` était une table fixe
  phase → texte, alors que `analyzeLimiters` (déjà calculé chaque semaine
  par le compositeur) explique précisément pourquoi une semaine alloue
  plus de fréquence à une discipline.
- **Cause racine** : aucun code n'appelait `analyzeLimiters` depuis l'UI.
- **Correction** : `explainWeekComposition(week, limiterAnalysis)` compte
  les vraies séances par discipline cette semaine et n'affiche la note
  limiteur que si elle est réellement vérifiée (jamais en semaine de
  course, jamais si le limiteur n'a en fait reçu aucune séance
  supplémentaire cette semaine-là).
- **Test de non-régression** : `explainWeekPurpose.test.ts` (5 nouveaux
  tests, dont le cas "athlète équilibré" et "semaine de course").

### 4. Aucun repère chiffré réel — toujours une zone brute ("Z3"), jamais la puissance/l'allure testée

- **Scénario** : un athlète ayant déclaré sa FTP/CSS/allure seuil voyait
  quand même "Z3 · RPE 6-8" sur chaque bloc, jamais "220–240 W".
- **Mauvais comportement** : `resolveIntensityPrescription` — déjà conçu,
  testé, et respectant scrupuleusement "jamais de fausse précision" — 
  n'était appelé depuis aucun écran.
- **Cause racine** : gap d'intégration, pas un défaut du resolver
  lui-même (confirmé par `docs/intensity-model.md`, qui documentait déjà
  l'usage prévu, jamais implémenté).
- **Correction** : `resolveBlockTargetDescription` + `SessionBlockList`
  appellent le resolver partout où un bloc est affiché.
- **Test de non-régression** : `intensityDisplay.test.ts` (4 tests) +
  `SessionBlockList.test.tsx` (le cas "FTP connu" vs "aucune métrique").

### 5. Auto-détecté et corrigé avant mise en prod : doublon "RPE" quand aucune métrique n'est testée

- **Scénario** : trouvé en relisant ma propre implémentation du point 4,
  avant tout commit — `resolveIntensityPrescription` renvoie déjà
  `"RPE X-Y"` comme repli quand rien n'est testé ; `SessionBlockList`
  affiche ensuite systématiquement `RPE X-Y` une seconde fois.
- **Mauvais comportement potentiel** : "RPE 6-8 · RPE 6-8" à l'écran pour
  tout athlète sans métrique testée — soit la majorité des nouveaux
  utilisateurs.
- **Cause racine** : `resolveBlockTargetDescription` renvoyait
  `targetDescription` même quand `usesTestedMetric` était `false`.
- **Correction** : ne renvoie une valeur que si `usesTestedMetric` est
  vrai ; sinon `undefined`, et l'appelant retombe sur le nom de zone brut
  (ou rien), jamais un doublon.
- **Test de non-régression** : `intensityDisplay.test.ts` — "returns
  undefined when the athlete has no tested metric".

### 6. La décision de progression n'était qu'un paragraphe, jamais un signal scannable

- **Scénario** : après une séance, "Pour la prochaine fois" affichait une
  phrase seule — aucun moyen de voir en un coup d'œil s'il s'agissait
  d'une progression, d'un maintien, ou d'un allègement, ni où l'athlète en
  est sur l'échelle de la famille.
- **Mauvais comportement** : contrairement à `AdaptationDecision` (déjà
  doté d'un badge + ligne avant/après via `AdaptationDecisionCard`),
  `ProgressionResponse.decision`/`.nextLevel` n'avaient aucun équivalent
  visuel.
- **Cause racine** : `progressionLabels.ts`/`ProgressionDecisionCard`
  n'existaient pas encore.
- **Correction** : créés sur le modèle exact de l'existant ; branchés
  dans les deux pages de feedback et dans une nouvelle vue Progrès par
  famille (gated sur `history.length > 0`).
- **Test de non-régression** : `progressionLabels.test.ts`,
  `ProgressionDecisionCard.test.tsx` — dont le contrat brief §58 ("un
  badge PROGRESS ne peut jamais afficher le libellé MAINTAIN").

### 7. Le statut limiteur/plus-forte n'était visible nulle part

- **Scénario** : le Profil affichait les trois niveaux déclarés
  (natation/vélo/course) côte à côte, sans dire ce que le programme en
  déduit.
- **Mauvais comportement** : `analyzeLimiters(profile).explanation` — une
  phrase déjà écrite, déjà utilisée en interne par le compositeur — 
  n'apparaissait sur aucun écran (brief §32).
- **Cause racine** : gap d'intégration.
- **Correction** : ajoutée sous les niveaux déclarés sur le Profil,
  seulement pour un profil triathlon non équilibré (jamais pour un
  coureur seul, dont `disciplineLevels.swim`/`.bike` n'existent pas).
- **Test de non-régression** : vérifié visuellement (athlète déséquilibré
  vs athlète débutant équilibré, QA navigateur) ; `analyzeLimiters`
  lui-même a sa propre couverture préexistante.

### 8. (Test uniquement) Un test e2e supposait que "aujourd'hui" est toujours un jour vélo

- **Scénario** : trouvé pendant la QA navigateur obligatoire (brief §59),
  pas dans l'application elle-même.
- **Mauvais comportement** : `e2e/accessibility.spec.ts` attendait
  `text=Vélo` sur Aujourd'hui après un onboarding standard — un test
  intermittent selon la date réelle d'exécution.
- **Cause racine** : oubli lors de l'écriture du test (un test voisin,
  "swapping discipline", documente déjà explicitement ce même piège et
  l'évite).
- **Correction** : attend le lien "Commencer" (toujours présent, quelle
  que soit la discipline) plutôt qu'un libellé de discipline.
- **Test de non-régression** : le test corrigé lui-même, exécuté deux
  fois pour confirmer la stabilité.

## Compatibilité des données

`PlannedSession.familyId`/`.reasonCodes` sont optionnels et rétro-
compatibles : un plan déjà persisté (généré avant ce milestone) les charge
simplement comme `undefined`, et chaque composant de présentation dégrade
proprement (`explainSession` renvoie `undefined` → l'appelant retombe sur
`session.objective`). Aucune migration de schéma n'était nécessaire.

## Limite connue : le niveau de progression n'influence pas (encore) la génération du plan

`decideProgressionResponse`/`ProgressionStateRepository` calculent un
niveau cible pour la prochaine exposition à une famille, mais
`generateTrainingPlan`/`buildWeekSessions.ts` ne consultent jamais cet
état — la variante de gabarit réellement prescrite reste pilotée par
`SessionTier` (position dans le cycle de charge), pas par la trajectoire
individuelle de l'athlète. C'était déjà vrai avant ce milestone ; ce
milestone rend simplement l'écart plus visible (en montrant enfin la
décision de progression à l'athlète) sans le corriger, puisque le reboucler
dans la génération de plan serait un changement de méthodologie
d'entraînement (V2.2), hors du périmètre d'une expérience de coaching
(brief §65). Les textes affichés restent honnêtes : ils décrivent ce que
le coach conclut de la dernière exposition, jamais une promesse que la
toute prochaine séance en tiendra compte automatiquement.
