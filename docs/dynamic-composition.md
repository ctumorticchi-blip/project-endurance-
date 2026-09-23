# Composition dynamique (Training Intelligence V2.1)

Voir `docs/weekly-composer.md` pour le détail module par module ; ce
document répond spécifiquement à une question : **pourquoi
`WEEKLY_SLOT_DISCIPLINES` a-t-il été supprimé, et par quoi a-t-il été
remplacé ?**

## Ce qui a disparu

`sports/triathlon/planning/weeklySlots.ts` et sa table
`WEEKLY_SLOT_DISCIPLINES` (fréquence par discipline indexée uniquement par
nombre de jours d'entraînement) ont été **entièrement supprimés**, avec
les deux mécanismes qui la contournaient après coup :
`applyLimiterSwimTouch` (donnait une 2ᵉ touche natation au limiteur en
sacrifiant un créneau de la discipline la plus forte) et
`applyBrickInsertion` (remplaçait un créneau existant par un brick). Les
deux étaient des correctifs *a posteriori* sur une décision déjà prise par
une table qui ne connaissait ni la phase, ni le budget temps réel, ni
l'analyse limiteur/plus-forte de l'athlète — d'où leur fragilité
documentée (une 2ᵉ touche natation invisible sur les semaines de brick ou
à faible nombre de jours, brief V2's defect log #3).

Il n'existe plus, nulle part dans le pipeline triathlon, une table qui
décide de la fréquence par discipline en fonction du seul nombre de jours.

## Ce qui l'a remplacé

`sports/triathlon/coaching/weeklyStimulusComposer.ts`'s
`generateWeeklySessionRequirements` est désormais la seule source de
fréquence — elle calcule directement, à partir du budget de la semaine et
de l'analyse limiteur/plus-forte, une liste de `SessionRequirement`
(structure sport-agnostique définie dans `core/coaching/sessionRequirement.ts`)
sans jamais toucher un jour calendaire. `sports/triathlon/planning/buildWeekSessions.ts`
place ensuite chaque exigence sur un vrai jour — il **exécute** une
décision déjà prise, il ne la prend jamais.

```
ATHLETE MODEL → GOAL → TRAINING PHASE → LIMITER/STRENGTH ANALYSIS
  → WEEKLY TRAINING BUDGET (jours ET minutes, deux plafonds indépendants)
  → WEEKLY STIMULUS REQUIREMENTS → SESSION REQUIREMENTS → SESSION PRIORITIES
  → RECOVERY CONSTRAINTS → DYNAMIC CALENDAR PLACEMENT
```

Propriétés que l'ancienne table ne pouvait pas offrir :

- **Une 2ᵉ touche natation pour un limiteur natation existe désormais
  comme un vrai `SessionRequirement`**, jamais comme le remplacement d'un
  créneau d'une autre discipline — elle ne peut donc plus disparaître
  simplement parce qu'aucun créneau à sacrifier n'existait cette
  semaine-là.
- **L'accès piscine est une contrainte de placement**, pas un rang de
  priorité — `placeRequirements` résout d'abord le sous-problème
  "exigences avec piscine contre jours avec piscine", généralisable à une
  future contrainte de ressource (home-trainer, piste, eau libre) sans
  changer de forme.
- **Le brick est une exigence composite qui réduit le besoin séparé
  vélo/course de la semaine**, plutôt qu'un ajout qui vient "sacrifier" un
  créneau existant après coup.
- **Le budget temps est un plafond, jamais une cible** — le compositeur
  n'est jamais obligé de dépenser toutes les minutes/jours déclarés.

## Pourquoi ce n'est pas seulement un renommage

Le remplacement corrige aussi, de façon générale (pas en patchant un cas
particulier), plusieurs défauts que l'ancienne architecture rendait soit
impossibles à corriger proprement, soit invisibles :

- le renforcement fait désormais partie du même budget de récupération que
  tout le reste, et n'est jamais automatique — voir le Coaching Defect Log
  (`docs/coaching-methodology.md`, défauts n°4 et suivants) pour le détail
  complet des défauts trouvés et corrigés pendant l'audit V2.1 ;
- le départage "quelle discipline reçoit le grand jour de la semaine"
  consulte désormais l'analyse limiteur/plus-forte de l'athlète plutôt que
  la durée médiane du catalogue (défaut n°8) ;
- la progression brick à 3 étages et les garde-fous anti-empilement
  d'intensité (défauts n°7 et n°9) n'auraient eu aucun endroit sensé où
  vivre dans l'ancienne table figée par nombre de jours — ils sont
  désormais des règles génériques du compositeur/placement.

## Aucun changement de schéma persisté

`SessionRequirement` est une structure intermédiaire, interne au
générateur — elle n'est jamais sérialisée ni exposée à l'UI. Rien dans
`localStorage`/le modèle de plan persisté n'a changé.
