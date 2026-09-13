# Adaptation Engine

Module : `engine/adaptation`. Décide comment le plan doit réagir à ce qui se
passe réellement (séance faite ou non, ressenti, disponibilité changée).

## Décisions possibles

```
KEEP | REDUCE | INCREASE | MOVE | REPLACE | REMOVE
```

## Signaux d'entrée (minimum M0)

- Séance réalisée ou non.
- Volume prévu vs réalisé, intensité prévue vs réelle.
- RPE, readiness (check-in pré-séance).
- Fatigue déclarée, charge récente (par discipline et globale).
- Historique récent (fenêtre glissante, pas un événement isolé).
- Priorité de la séance, proximité de la compétition.
- Disponibilité déclarée vs disponibilité réelle apprise.

## Règle d'or

**Une seule séance ne doit pas modifier fortement le plan.** Toute décision
d'ampleur (ex. réduire une semaine entière) s'appuie sur une fenêtre
d'historique, jamais sur un seul point de données.

## Observabilité — objet de décision structuré

Chaque décision produit un objet traçable :

```ts
interface AdaptationDecision {
  type: 'KEEP' | 'REDUCE' | 'INCREASE' | 'MOVE' | 'REPLACE' | 'REMOVE'
  sessionId: string
  reasons: ReasonCode[]        // ex. 'HIGH_RECENT_RPE', 'ELEVATED_FATIGUE'
  before: Partial<PlannedSession>
  after: Partial<PlannedSession>
  explanation: string          // phrase prête pour l'UI
}
```

Cet objet sert à la fois aux tests, au debugging, à l'explication affichée
à l'utilisateur, et plus tard au coach IA (M4.9) qui reformulera ces
décisions en langage naturel sans jamais avoir le pouvoir de les prendre
lui-même.

## Séances manquées

Demander la raison (temps, fatigue, douleur, imprévu, météo, matériel,
autre), puis décider : abandonner / déplacer / réduire / remplacer /
replanifier. Jamais de dette d'entraînement automatique — le volume manqué
ne s'empile pas mécaniquement sur les jours suivants.

## Apprentissage de la disponibilité réelle

Le moteur distingue **disponibilité déclarée** et **disponibilité réelle**
(séances effectivement complétées sur plusieurs semaines). Un écart
persistant déclenche une proposition explicite d'ajustement du programme
(ex. passer de 6 à 5 séances/semaine en conservant les séances prioritaires)
— jamais un ajustement silencieux.

## Invariants testés

- Aucune journée ne dépasse la disponibilité déclarée sans raison explicite.
- Aucune séance ne se trouve après la date de course dans le cycle actif.
- L'affûtage réduit la charge par rapport au pic précédent.
- Une séance `REMOVE` ne reste pas active dans le plan.
- Une séance `MOVE` n'existe pas en double.
- Aucune adaptation ne produit une durée négative.
- Aucune zone n'a de bornes incohérentes (min ≥ max).
- Un plan possède au moins les disciplines nécessaires à l'objectif
  triathlon (natation, vélo, course).
- Aucune dette d'entraînement incontrôlée après une série de séances ratées.
