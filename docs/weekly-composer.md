# Weekly Stimulus Composer

Modules : `sports/triathlon/coaching/weeklyStimulusComposer.ts`,
`sports/triathlon/coaching/limiterAnalysis.ts`,
`sports/triathlon/planning/weeklySlots.ts` + `buildWeekSessions.ts`.

## "Le triathlon n'est pas trois plans séparés"

Principe non négociable du brief (§24) : le moteur ne pose jamais la
question "que fait-on en natation cette semaine ?" indépendamment du vélo
et de la course. La question est : **quel est le meilleur ensemble de
stimuli triathlon que cet athlète peut réellement absorber cette semaine ?**
— en tenant compte des interactions entre disciplines (fatigue partagée,
séances incompatibles en voisinage, brick qui combine deux disciplines en
une seule séance).

## Limiter / Strength Analysis (`limiterAnalysis.ts`)

Avant même de composer la semaine, `analyzeLimiters(profile)` compare les
trois niveaux déclarés (`disciplineLevels.swim/bike/run`) entre eux :

```ts
interface DisciplineStrengthAnalysis {
  levels: Record<'swim'|'bike'|'run', Level>
  limiter: 'swim'|'bike'|'run'      // la discipline qui a le plus besoin de développement
  strongest: 'swim'|'bike'|'run'    // la discipline maintenable avec proportionnellement moins de temps
  isBalanced: boolean               // les trois niveaux sont identiques
  hasTestedMetric: Record<...>      // signal de confiance, jamais une réécriture du niveau déclaré
  explanation: string
}
```

- **Départage déterministe** quand deux disciplines partagent le même
  niveau : la natation est favorisée comme limiteur (un déficit technique
  en natation est le limiteur triathlon le plus courant et a le meilleur
  retour sur travail technique ciblé, brief §19) ; la course est favorisée
  comme discipline la plus forte (protéger la course d'être
  silencieusement sous-priorisée, car sur-réduire son volume est la façon
  la plus rapide de perdre en forme sur cette discipline).
- Une métrique testée (FTP/CSS/allure seuil) n'écrase **jamais** le niveau
  déclaré — c'est une note de confiance explicative, pas une source de
  vérité concurrente (pas de fausse précision à partir d'un seul test).

## La rotation ajustée au limiteur (`getLimiterAdjustedRotation`)

La séance secondaire d'une discipline (2ᵉ occurrence de la semaine, en
développement/spécifique) suit une rotation sur 4 semaines qui dépend de la
position de cette discipline dans l'analyse :

| Position | Rotation | Logique |
|---|---|---|
| Discipline neutre (ni limiteur ni la plus forte) | `GENERIC_ROTATION` — endurance → sortie longue → VO2max/fractionné → endurance | Rotation par défaut, développement classique |
| **Limiteur** | `LIMITER_DEVELOPMENT_ROTATION` — remplace l'entrée haut de gamme (VO2max/fractionné) par une deuxième touche technique/développement | Brief §19 : "un nageur faible bénéficie davantage de travail technique ciblé que de plus de volume ou d'intensité" — généralisé aux trois disciplines |
| **La plus forte** | `STRENGTH_MAINTENANCE_ROTATION` — abandonne les entrées longues/haut de gamme, reste à un défaut facile/entretien | Maintenir sans lui consacrer un temps disproportionné (brief §18/§24) |

Un athlète équilibré (`isBalanced`) reçoit la rotation générique pour les
trois disciplines — rien à biaiser sans écart réel entre disciplines.

## Placement au calendrier (`weeklySlots.ts` + `buildWeekSessions.ts`)

Le placement au calendrier **exécute** une décision déjà prise plus haut
dans le pipeline ; il ne la prend pas.

1. `WEEKLY_SLOT_DISCIPLINES[numDays]` — table déterministe : combien de fois
   chaque discipline apparaît selon le nombre de jours d'entraînement
   disponibles cette semaine (natation ne dépasse jamais 1 occurrence dans
   cette table de base — voir la limitation connue plus bas et
   `docs/coaching-methodology.md`'s defect log #3).
2. `shouldInsertBrick` / `applyBrickInsertion` — en phase spécifique,
   une semaine sur deux, remplace le dernier créneau secondaire vélo/course
   par un brick.
3. `shouldInsertLimiterSwimTouch` / `applyLimiterSwimTouch` — en base/
   développement/spécifique, si le limiteur de l'athlète est la natation,
   remplace un créneau secondaire de sa discipline **la plus forte** par
   une deuxième touche natation (jamais en affûtage/course, qui réduisent
   le volume plutôt que d'en ajouter).
4. **Priorité de réclamation des jours** (`dayAssignmentRank`,
   `buildWeekSessions.ts`) : natation en premier (le seul créneau qui a
   *besoin* spécifiquement d'un jour avec accès piscine), puis les séances
   clé, puis le brick (a besoin de plus de temps qu'une touche secondaire
   ordinaire), puis tout le reste. Corrige deux défauts réels trouvés en
   relisant le Gold Standard — voir le defect log complet dans
   `docs/coaching-methodology.md`.
5. `pickBestFittingTemplate` — au sein d'un créneau, choisit le gabarit du
   catalogue qui correspond au type visé et rentre dans le temps
   disponible, en dégradant vers des types plus faciles avant de rogner sur
   la durée à l'aveugle (`EASY_FALLBACK_BY_DISCIPLINE`).

## Limitation connue

`WEEKLY_SLOT_DISCIPLINES` reste une table fixe par nombre de jours qui ne
donne jamais plus d'une occurrence à la natation. La deuxième touche
natation (`applyLimiterSwimTouch`) contourne cette limite en réutilisant un
créneau existant plutôt qu'en ajoutant un vrai 2ᵉ slot dédié — elle ne
peut donc apparaître que si un créneau de la discipline la plus forte
existe à sacrifier (absent sur les semaines de brick, sur les semaines à
peu de jours d'entraînement). Une restructuration plus profonde de cette
table reste un candidat de futur milestone.
