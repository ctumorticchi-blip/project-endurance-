# Product Vision

## Ce que nous construisons

Project Endurance (nom de code interne — la marque commerciale n'est pas
encore choisie, voir `src/config/brand.ts`) est une **plateforme de coaching
sportif individuel adaptatif**. Le premier sport est le **triathlon** ; la
plateforme est conçue pour accueillir plus tard running, cyclisme, natation
et trail sans réécriture majeure (voir `architecture.md`).

## Le problème

Les triathlètes amateurs disposent de solutions imparfaites : plans PDF
statiques, plans génériques, applications riches en données mais pauvres en
décisions, coach humain efficace mais coûteux, ou pseudo-coachs IA qui
génèrent des séances sans logique transparente.

Nous construisons quelque chose entre **le plan automatique** et **le coach
humain**. L'utilisateur ne doit plus se demander : *Que dois-je faire
aujourd'hui ? Pourquoi cette séance ? J'ai raté hier, que faire ? Je suis
fatigué, dois-je quand même faire les intervalles ? Pourquoi mon programme
vient-il de changer ?*

## Promesse produit

> « Ton entraînement s'adapte à ta progression, ta récupération et ta vraie
> vie. »

Le sentiment recherché : **« Mon programme me connaît »** — pas « j'ai
téléchargé un plan de 12 semaines ».

## Ce que "programme" veut dire (Training Intelligence V2)

> Project Endurance ne génère pas un calendrier de séances. Il prescrit une
> **progression de stimuli d'entraînement** pour un athlète précis, vers
> une course précise, et adapte cette progression selon la réponse réelle
> de l'athlète.

Une bonne programmation n'est pas une collection de bonnes séances : c'est
une progression cohérente de stimuli. Voir `docs/coaching-methodology.md`
pour le pipeline complet (modèle athlète → analyse limiteur/force → phase
→ besoins hebdomadaires → allocation → famille de séance → niveau de
progression → prescription individuelle → placement calendrier → réponse
de l'athlète → décision suivante) et le principe "le triathlon n'est pas
trois plans séparés" (`docs/weekly-composer.md`).

## Vision business

Nous ne vendons pas un plan (qui se termine après la course), mais un
**coach personnel continu**. La boucle de rétention centrale :

```
OBJECTIF → PROGRAMME → ENTRAÎNEMENT → DONNÉES → ANALYSE
   → ADAPTATION → PROGRESSION → COURSE → RÉCUPÉRATION → NOUVEL OBJECTIF
```

La valeur augmente avec l'historique accumulé : rétention, abonnement,
personnalisation long terme.

## Cible M0

Le **triathlète amateur régulier** : travaille, temps limité, s'entraîne
3–7×/semaine, prépare un Sprint ou un M, apprécie les données précises,
ne veut pas gérer un tableur complexe. L'app reste accessible à quelqu'un
préparant son premier triathlon. M0 ne vise pas les professionnels, l'élite,
l'Ironman avancé, l'ultra-endurance ou le coaching médical.

## Ce que nous ne sommes pas

Pas un réseau social façon Strava, pas un clone de Garmin Connect ou
TrainingPeaks, pas une application médicale ou de musculation, pas
« ChatGPT + un calendrier ». Nous construisons :

```
COACHING ENGINE + SPORT SCIENCE + ATHLETE DATA + SIMPLE UX
```

## Priorités (dans l'ordre)

1. Cohérence sportive
2. Sécurité (pas de fausse promesse médicale, pas de surcharge dangereuse)
3. Explicabilité (aucune décision importante sans explication)
4. Testabilité
5. UX
6. Polish visuel

Une belle application avec un mauvais moteur est un échec.

## Vision long terme (M1 → M10)

Voir `roadmap.md` pour le détail. Le principe directeur : **penser long
terme, construire court terme**. Chaque phase ne construit que ce qui est
nécessaire pour valider la suivante — YAGNI appliqué à un mandat pluriannuel.
