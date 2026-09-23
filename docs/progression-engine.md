# Progression Engine

Module : `engine/progression/` + `core/coaching/progressionState.ts`. Ferme
la boucle que l'audit initial de Training Intelligence V2 a trouvée
manquante : l'ancien `SessionTier` ne suit qu'une courbe de charge fixée à
la position dans la semaine, jamais la réponse réelle de l'athlète.

## État de progression par famille

```ts
interface FamilyProgressionState {
  familyId: string
  currentLevel: number
  history: ProgressionExposure[]   // 6 dernières expositions, la plus récente en dernier
}

interface ProgressionExposure {
  date: DateISO
  level: number
  outcome: 'completed' | 'partial' | 'missed'
  targetRpe?: number
  actualRpe?: number
}
```

Persisté par famille (`ProgressionStateRepository`, `core/coaching/`),
séparément du reste de l'historique de séances — le moteur sait ainsi, pour
chaque famille, ce qui a été prescrit, comment l'athlète a répondu, et ce
qui devrait se passer ensuite (brief §13).

## Les cinq décisions

```
PROGRESS | MAINTAIN | REGRESS | RECOVER | RECALIBRATE
```

Décidées par `decideProgressionResponse` (`engine/progression/`),
déterministe et explicable — jamais un LLM comme source de la décision.

| Décision | Déclencheur | Effet |
|---|---|---|
| `RECOVER` | Fatigue globale récente élevée (`recentOverallFatigueElevated`, dérivée de `deriveOverallFatigueSignal`) | Niveau inchangé — la progression de *cette* famille est mise en pause sans reculer, quel que soit le RPE de la dernière exposition |
| `RECALIBRATE` | 3 dernières expositions consécutives (`MIN_EXPOSURES_FOR_RECALIBRATION = 3`) toutes décalées d'au moins `RECALIBRATE_RPE_MARGIN = 1.5` dans la même direction | Recommande un nouveau test de la zone elle-même (allure/puissance), pas seulement un changement de niveau |
| `MAINTAIN` (séance manquée) | Dernière exposition `missed` | Niveau inchangé faute de nouvelle donnée |
| `REGRESS` (séance partielle) | Dernière exposition `partial` | Niveau -1 (minimum 1) |
| `PROGRESS` | Séance complétée, `actualRpe - targetRpe ≤ -PROGRESS_RPE_MARGIN` (1 point) | Niveau +1 (plafonné à `progressionLevels` de la famille — au-delà, `MAINTAIN` avec `MAX_LEVEL_REACHED`) |
| `REGRESS` | Séance complétée, `actualRpe - targetRpe ≥ REGRESS_RPE_MARGIN` (1.5 point) | Niveau -1 (minimum 1) |
| `MAINTAIN` | Séance complétée, écart RPE dans la marge normale, ou RPE non renseigné | Niveau inchangé |

**Règle d'or, cohérente avec `decideAdaptation`** : une seule exposition
suffit pour bouger le niveau de l'échelle (un coach réagit à comment s'est
passée la dernière séance clé), mais **recalibrer la zone elle-même exige
une évidence répétée** — jamais une seule séance exceptionnelle. C'est
`RECALIBRATE` qui gagne sur `PROGRESS`/`REGRESS` quand 3 expositions
consécutives pointent toutes dans la même direction : le problème n'est
alors plus le niveau de la séance, mais la cible d'intensité testée
elle-même qui est devenue obsolète.

## Dimensions de progression

Une échelle de progression ne bouge pas uniquement la durée. `progressionLevels`
d'une famille représente une échelle abstraite ; le contenu réel de chaque
palier (dans le catalogue `sports/triathlon/sessions/`) peut varier sur
plusieurs axes indépendants — volume total, durée d'intervalle, nombre de
répétitions, ratio effort:récupération, intensité, densité, spécificité,
complexité technique — sans empiler plusieurs axes à coût élevé sans
justification (brief §13/§14 : éviter la surcharge accidentelle par cumul
de dimensions).

## Signal de fatigue globale

`deriveOverallFatigueSignal` (`engine/progression/`) — dérivé de l'historique
de feedback récent (toutes disciplines confondues), pas spécifique à une
famille : une fatigue accumulée met en pause la progression de *toutes* les
familles à la fois, cohérent avec le principe qu'un athlète fatigué ne
"progresse" sélectivement dans aucune discipline. Duplique volontairement
une petite portion de la logique RPE-moyen de `decideAdaptation.ts` plutôt
que de la partager, pour garder les deux moteurs indépendants et testables
séparément (préférence documentée du projet : une petite duplication plutôt
qu'un couplage risqué entre deux moteurs aux responsabilités distinctes).

## Orchestration (`processSessionFeedback`)

Fonction pure, sans accès au stockage — le point d'entrée unique utilisé par
les écrans de feedback :

```ts
processSessionFeedback(input: {
  session: PlannedSession
  outcome: SessionOutcome
  actualRpe?: number
  family: WorkoutFamily
  currentState: FamilyProgressionState
  recentFeedback: SessionFeedback[]
}): { nextState: FamilyProgressionState; response: ProgressionResponse }
```

La cible RPE de la séance pour la progression est le **point milieu du bloc
le plus dur** de la séance (pas une moyenne sur tous les blocs — un
échauffement facile ne doit pas diluer la cible d'une séance seuil).

Appelé par `CompletedFeedbackPage.tsx` et `MissedSessionPage.tsx` :
`ProgressionStateRepository.loadByFamilyId` → `processSessionFeedback` →
`ProgressionStateRepository.save(nextState)`. Le champ `response.explanation`
est affiché directement à l'athlète (voir `docs/gold-standard.md`'s UX
notes et le changement TIV2-K).

## Reason codes

```
ATHLETE_READY_TO_PROGRESS | TARGET_RPE_MATCHED | RPE_HIGHER_THAN_EXPECTED
RPE_LOWER_THAN_EXPECTED | PERSISTENT_FATIGUE | MISSED_LAST_EXPOSURE
INSUFFICIENT_HISTORY | ZONE_RECALIBRATION_REQUIRED | MAX_LEVEL_REACHED
```

## Invariants testés

- Une seule exposition insuffisante ne recalibre jamais rien
  (`decideProgressionResponse.test.ts`).
- Le niveau ne descend jamais sous 1, ni au-dessus de `progressionLevels`.
- `RECOVER` ne fait jamais reculer le niveau, seulement le mettre en pause.
- `RECALIBRATE` exige 3 expositions consécutives dans la même direction —
  un mélange (une séance facile, une dure, une facile) ne déclenche rien.
