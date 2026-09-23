# Workout Families

Module : `core/coaching/workoutFamily.ts` (le type, sport-agnostique) et
`sports/triathlon/coaching/workoutFamilies.ts` (le registre triathlon
concret, `WORKOUT_FAMILIES`).

## Ce qu'est une Workout Family

Une Workout Family est un **stimulus d'entraînement nommé, avec une
progression** — pas une séance fixe unique. Chaque famille regroupe tous
les `SessionTemplate` existants d'un même couple `(discipline, SessionType)`
du catalogue (`sports/triathlon/sessions/`).

C'est une **couche d'annotation**, pas un remplacement du catalogue :
`SessionTemplate`/`SessionTier` continuent de porter les blocs réellement
authored ; une `WorkoutFamily` explique *pourquoi* un couple
(discipline, sessionType) existe, à quel moment il a sa place, et comment un
coach devrait raisonner pour le substituer ou le séquencer.

## Forme d'une famille

```ts
interface WorkoutFamily {
  id: string                        // ex. 'RUN_THRESHOLD'
  discipline: Discipline
  sessionType: SessionType          // le couple (discipline, sessionType) du catalogue existant
  trainingPurpose: string
  physiologicalIntent: string
  appropriatePhases: TrainingPhaseName[]
  raceFormatRelevance: Partial<Record<'sprint' | 'olympic', 'primary' | 'secondary' | 'minor'>>
  minimumAthleteLevel?: Level
  progressionLevels: number         // longueur de l'échelle de progression
  defaultPriority: StimulusPriority // KEY_A | KEY_B | SUPPORT | EASY | RECOVERY | OPTIONAL
  fatigueCost: 'low' | 'moderate' | 'high'
  recoveryRequirement: 0 | 1 | 2    // en jours d'entraînement, pas en heures
  compatibleNeighbors?: string[]
  incompatibleNeighbors?: string[]
  requiredEquipment?: string[]
  requiredMetric?: string[]         // ex. ['ftpWatts'] — débloque une prescription précise
  fallbackPrescription: string      // ce qui est prescrit sans requiredMetric — toujours RPE
  explanation: string               // le "pourquoi cette séance" affiché à l'athlète
  evidenceClassification: EvidenceClassification
}
```

## Le registre triathlon (`WORKOUT_FAMILIES`)

### Natation

| Famille | `sessionType` | Priorité | Coût fatigue | Phases |
|---|---|---|---|---|
| `SWIM_TECHNIQUE` | technique | SUPPORT | low | base, build |
| `SWIM_ENDURANCE` | endurance | EASY | low | base, build, taper |
| `SWIM_CSS` | css | KEY_B | moderate | build |
| `SWIM_THRESHOLD` | threshold | KEY_B | moderate | specific |
| `SWIM_SPEED` | intervals | SUPPORT | moderate | build, specific |
| `SWIM_RECOVERY` | recovery | RECOVERY | low | toutes |

### Vélo

| Famille | `sessionType` | Priorité | Coût fatigue | Phases |
|---|---|---|---|---|
| `BIKE_ENDURANCE` | endurance | EASY | low | base, build, taper |
| `BIKE_TEMPO` | tempo | SUPPORT | moderate | build |
| `BIKE_SWEET_SPOT` | sweet-spot | KEY_B | moderate | build |
| `BIKE_THRESHOLD` | threshold | KEY_A | high | build, specific |
| `BIKE_VO2` | vo2max | KEY_B | high | specific |
| `BIKE_LONG` | long | KEY_A | high | base, build, specific |
| `BIKE_CADENCE` | technique | OPTIONAL | low | base, build |
| `BIKE_RACE_SPECIFIC` | race-specific | KEY_B | moderate | specific |

### Course à pied

| Famille | `sessionType` | Priorité | Coût fatigue | Phases |
|---|---|---|---|---|
| `RUN_ENDURANCE` | endurance | EASY | low | base, build, taper |
| `RUN_LONG` | long | KEY_A | high | base, build, specific |
| `RUN_TEMPO` | tempo | SUPPORT | moderate | build, taper |
| `RUN_THRESHOLD` | threshold | KEY_A | high | build, specific |
| `RUN_VO2` | intervals | KEY_B | high | specific |
| `RUN_STRIDES` | technique | OPTIONAL | low | build, specific, taper |
| `RUN_RACE_SPECIFIC` | race-specific | KEY_B | moderate | specific |
| `RUN_RECOVERY` | recovery | RECOVERY | low | toutes |

### Brick

| Famille | `sessionType` | Priorité | Coût fatigue | Phases |
|---|---|---|---|---|
| `BRICK_ADAPTATION` | brick | KEY_B | moderate | specific |
| `BRICK_SPECIFIC` | race-specific | KEY_A | high | specific |
| `BRICK_RACE_REHEARSAL` | race-specific | KEY_A | high | specific |
| `TRANSITION_PRACTICE` | transition | OPTIONAL | low | specific, taper |

### Renforcement / mobilité

| Famille | `sessionType` | Priorité | Coût fatigue | Phases |
|---|---|---|---|---|
| `STRENGTH_FOUNDATION` | strength | SUPPORT | moderate | base, build |
| `STRENGTH_MAINTENANCE` | strength | OPTIONAL | low | specific, taper |
| `MOBILITY_GENERAL` | mobility | OPTIONAL | low | toutes |

## Cas particuliers documentés

- **`BRICK_SPECIFIC` et `BRICK_RACE_REHEARSAL` partagent volontairement le
  couple `(brick, 'race-specific')`.** Elles diffèrent par *palier* de
  catalogue (standard vs. peak), pas par `SessionType` — une simulation
  complète de course est la même intention d'entraînement à une exposition
  plus rare et plus dure, pas un stimulus distinct. `getFamilyForSession`
  résout ce couple vers `BRICK_SPECIFIC` de façon déterministe (ordre
  d'insertion de l'objet) : le cas courant, correct pour tous les usages du
  Weekly Composer (qui demande une famille cible ; le système de palier
  existant décide déjà quel gabarit — standard ou peak — est réellement
  choisi).
- **`SWIM_TEMPO` n'existe pas comme entrée séparée** : repliée dans
  `SWIM_ENDURANCE`. L'entraînement natation ne distingue pas un palier
  "modéré-soutenu" de la même façon que vélo/course, une fois que
  CSS/seuil couvrent déjà la plage sous-seuil à seuil.
- **`SWIM_OPEN_WATER` n'a pas d'entrée** : aucun gabarit de catalogue
  n'existe pour elle, et elle n'est volontairement jamais sélectionnée —
  le produit n'a aucun moyen de savoir si un athlète a un accès sûr à l'eau
  libre (brief §19), donc la programmer serait une supposition non fondée,
  pas une décision de coaching.

## Comment une famille est retrouvée pour une séance

```ts
getFamilyForSession(discipline, sessionType): WorkoutFamily | undefined
```

C'est le seul point où `buildWeekSessions.ts`, `CompletedFeedbackPage.tsx`
et `MissedSessionPage.tsx` résolvent "à quelle famille appartient ce
créneau/cette séance", sans dupliquer la connaissance du catalogue
ailleurs.
