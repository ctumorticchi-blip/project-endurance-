# Intensity Model — intent vs. mesure

Module : `engine/intensity/resolveIntensityPrescription.ts`. Sépare
**l'intention d'entraînement** de **la méthode de mesure** (brief §15) — une
distinction qui existait déjà implicitement (`WorkoutBlock.targetZone` +
`targetRpeMin/Max`) mais jamais formalisée comme un choix explicite de
méthode de mesure avec sa propre hiérarchie de fiabilité par discipline.

## Le principe

Un bloc porte toujours une **zone relative** (`targetZone: 'Z1'..'Z5'`,
sport-agnostique) — c'est l'intention (à quel effort relatif ce bloc doit
se situer). `resolveIntensityPrescription` traduit cette intention dans la
**méthode de mesure la plus fiable que l'athlète a réellement déclarée**,
avec repli progressif :

```ts
type MeasurementMethod = 'power' | 'pace' | 'heartRate' | 'rpe'

interface IntensityPrescription {
  measurementMethod: MeasurementMethod
  targetDescription: string   // "220–240 W", "4:30–4:45 /km", "142–155 bpm", "RPE 7-8"
  rpeRange: [number, number]  // toujours présent — le filet de sécurité universel
  usesTestedMetric: boolean
  explanation: string
}
```

Le RPE (`rpeRange`) est **toujours** présent, même quand une métrique
précise pilote la prescription — c'est le garde-fou universel déjà en place
dans `WorkoutBlock`, jamais retiré.

## Hiérarchie de fiabilité par discipline (PRODUCT_RULE)

Choisie pour sa fiabilité en conditions réelles d'entraînement, pas comme
une affirmation qu'une métrique serait "physiologiquement supérieure" à une
autre :

| Discipline | Ordre de priorité | Justification |
|---|---|---|
| Vélo | puissance → FC → RPE | La puissance est le signal le moins bruité à vélo ; la FC retarde par rapport à l'effort et dérive avec la chaleur/fatigue |
| Course | allure → FC → RPE | L'allure est directement actionnable en extérieur ; la FC est un second choix raisonnable, contrairement à la natation |
| Natation | allure (CSS) → RPE | Le suivi de FC est peu praticable/fiable en piscine pour la quasi-totalité des athlètes — `COACHING_HEURISTIC`, pas modélisé comme palier de repli ici |
| Renforcement / mobilité / brick / transition | RPE uniquement | Aucun système de zone ne s'applique |

Aucun palier n'est jamais court-circuité : un athlète avec uniquement un
téléphone obtient tout de même une prescription cohérente (RPE) ; un
athlète avec GPS+FC+puissance obtient plus de précision — jamais l'inverse,
et jamais un chiffre fabriqué quand le test sous-jacent n'a pas été fait
(même règle déjà appliquée par `calculateAthleteZones.ts`).

## Formatage par discipline

- **Puissance** : `"220–240 W"`, ou `"250 W+"` quand la zone haute n'a pas
  de borne supérieure (Z5+).
- **Fréquence cardiaque** : `"142–155 bpm"`, même traitement pour la borne
  ouverte.
- **Allure course** : `"4:30–4:45 /km"`, ou `"plus rapide que 4:15/km"`
  pour une borne ouverte.
- **Allure natation** : `"1:40–1:45 /100m"`, même traitement pour une borne
  ouverte.

## Utilisation

Appelé partout où un bloc doit être affiché avec une cible concrète plutôt
que seulement une zone abstraite — remplace un futur besoin d'ajouter cette
logique séparément à chaque écran (Aujourd'hui, détail de séance, lecteur
de séance).
