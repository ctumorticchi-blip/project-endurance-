# Training Philosophy

## Déterministe, testable, explicable

La programmation est **principalement déterministe**. Nous ne demandons
jamais à un LLM « génère-moi une semaine d'entraînement » — le moteur décide,
selon des règles écrites et testées. Une couche IA pourra plus tard
*expliquer* ces décisions en langage naturel (M4.9), mais elle n'a pas le
pouvoir de modifier arbitrairement la programmation.

## Distribution de l'intensité

Approche générale : **polarisée / pyramidale adaptable**, pas de règle
rigide 80/20. La distribution dépend de la discipline, du niveau, de la
phase, de l'objectif, de l'historique, de la récupération, de la
disponibilité et de la proximité de la compétition. Le moteur distingue
toujours trois axes indépendants : **volume**, **intensité**, **spécificité**.

## Programme dynamique, pas un cycle figé

Le plan dépend de la **date réelle de la course**, pas d'un cycle
arbitrairement fixé à 12 semaines. Le moteur construit le programme à
rebours à travers les phases :

```
BASE → DÉVELOPPEMENT → SPÉCIFIQUE → AFFÛTAGE → COURSE
```

Une course dans 6 semaines, 12 semaines et 24 semaines produisent des durées
de phase différentes. Si le délai est manifestement incompatible avec le
niveau déclaré, le moteur ne fabrique pas un plan dangereusement agressif —
il le signale.

## Disciplines

Principales : natation, vélo, course. Compléments : renforcement, mobilité,
récupération (le renforcement n'est **pas** une quatrième discipline
équivalente). Spécifiques triathlon : brick, transitions, séances
race-specific.

## Explicabilité : règle absolue

**Aucune modification importante sans explication.** Chaque décision
d'adaptation répond à trois questions : *Qu'est-ce qui change ? Pourquoi ?
Quelle conséquence sur la suite ?* Exemple :

> « J'ai réduit ta séance vélo de 75 à 55 minutes car ton RPE récent est
> supérieur aux prévisions et tu as signalé une fatigue élevée aujourd'hui.
> La sortie longue du week-end reste inchangée. »

Techniquement, cela veut dire que chaque décision d'adaptation produit un
objet structuré avec des reason codes (voir `adaptation-engine.md`) — jamais
une logique opaque.

## Sécurité et douleur

**Douleur ≠ fatigue.** Le produit ne diagnostique pas, ne traite pas, ne
promet pas d'éviter les blessures, et ne présente aucune formule de charge
comme prédicteur médical fiable. En cas de douleur significative :
adaptation prudente, suspension des séances concernées si pertinent, et
recommandation d'un avis professionnel quand c'est approprié.

## Pas de fausse science

Interdiction de créer une fausse précision scientifique (ex. « Race
readiness : 87,4 % » sans méthodologie défendable). Tout score synthétique
doit être **documenté, décomposable, explicable**.

## Séances manquées : jamais de dette d'entraînement

Une séance manquée déclenche une question (raison : temps, fatigue,
douleur, imprévu, météo, matériel, autre) puis une décision : abandonner,
déplacer, réduire, remplacer ou replanifier — jamais un empilement mécanique
du volume manqué sur les jours suivants. Une séance technique facile ratée
n'a pas la même priorité qu'une sortie spécifique importante.

## Une séance ne fait pas le plan

**Une seule séance ne doit pas modifier fortement le programme.** Le moteur
d'adaptation raisonne sur des fenêtres d'historique (plusieurs séances,
plusieurs semaines), pas sur un événement isolé.
