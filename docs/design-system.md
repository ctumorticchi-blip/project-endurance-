# Design System (M1.0, rebrand "explosif" en M1.9)

Direction d'origine (M1.0) : premium, sportif, calme, précis (brief §39).
Retour utilisateur en M1.9 : ce calme lisait comme corporate/froid plutôt
que motivant — direction révisée, **explosif et moderne**, tout en gardant
non négociable ce que "calme, précis" protégeait vraiment : lisibilité
avant tout, pas de dashboard financier, pas d'avalanche de graphiques, et
surtout **zéro régression de contraste WCAG**. L'énergie vient de la
palette (couleurs vives), de touches ponctuelles (halos, emoji, une
illustration), pas d'un abandon de la rigueur d'accessibilité.

## Tokens

Deux emplacements, gardés synchronisés à la main :

- `src/config/brand.ts` — source de vérité pour tout ce que le JS lit
  (couleurs, typographie, espacement, rayons, métadonnées).
- `src/index.css` (`@theme`) — les mêmes valeurs en variables CSS/utilitaires
  Tailwind, puisque Tailwind ne peut pas importer un module TS au build.

Palette (M1.9, rebrand "explosif") : fond aubergine très sombre
(`#160F23` — anciennement le bleu-marine `#0D1B2A` de la palette Garmin),
surfaces légèrement plus claires par paliers de la même teinte (`surface`
→ `surface-muted` → `surface-raised`), un **orange corail vif** en
primaire (`#FF6B4A`, la couleur de marque/action — anciennement un bleu
`#4EA1FF`) et un **turquoise vif** en accent (`#2FE6B0` — anciennement un
vert `#3DDC97`). `warning`/`danger` ont aussi été retintés pour rester
lisibles sur le nouveau fond (`#FFC24B` / `#FF6767`). Texte en trois
intensités (`text` / `text-muted` / `text-faint`) — jamais d'information
critique portée uniquement par la couleur.

**Toute la palette est revérifiée à chaque changement, pas seulement les
valeurs qu'on modifie explicitement** : changer le fond change le
contraste de tout ce qui est dessiné dessus. Avant de fixer les valeurs
ci-dessus, un script a recalculé le ratio WCAG de chaque paire texte/fond
(`text`/`text-muted`/`text-faint`/`primary`/`accent`/`warning`/`danger` ×
les quatre fonds) et de chaque bouton (couleur du label sur le fond du
bouton). Résultats pour la palette M1.9 (pire cas par ligne) :
`text` ≥ 13.7:1, `text-muted` ≥ 6.6:1, `text-faint` ≥ 5.1:1, `primary` ≥
5.2:1, `accent` ≥ 9.0:1, `warning` ≥ 9.0:1, `danger` ≥ 5.1:1 — marge
confortable partout au-dessus du seuil de 4.5:1. `text-faint` a dû être
éclairci une nouvelle fois pendant cette passe (`#9686AC` → `#A093B8`,
seule valeur qui échouait au premier essai, à 4.35:1 sur `surface-raised`).

**Règle de contraste (Badge)** : chaque `Badge` teinté (`primary`/`accent`/
`warning`/`danger`) mélange sa couleur à 6 % au-dessus de son fond. Un
`Badge` n'apparaît jamais sur un seul fond : selon la `Card` qui l'entoure,
c'est `background`, `surface`, `surface-muted` ou `surface-raised` — les
quatre doivent tenir 4.5:1. Ce pourcentage n'est pas une constante figée :
il a déjà dû être recalculé deux fois (15 % → 8 % en M1 quand `danger`
échouait sur `surface-raised`, 8 % → 6 % avec la palette Garmin) — la
passe M1.9 a revérifié les quatre tonalités × quatre fonds à 6 % sur la
nouvelle palette et ça tient toujours (pire cas 4.70:1, `danger` sur
`surface-raised`), donc l'alpha n'a pas bougé cette fois. Il devra être
recalculé à nouveau si une des quatre couleurs de fond ou une des quatre
tonalités change. Ne jamais recalibrer une seule tonalité isolément :
vérifier les quatre fonds pour les quatre tonalités avant de changer
l'alpha.

Ne jamais imbriquer un `Badge` teinté à l'intérieur d'un autre conteneur
déjà teinté de la même couleur (ex. une bannière `bg-accent/10`) : les deux
calques translucides s'additionnent, éclaircissent le fond composite, et
font échouer le contraste (mesuré 3.97:1 dans ce cas précis, à l'ancien
réglage 15 % — trouvé et corrigé via un scan axe-core réel, pas en lecture
de code). Dans ce contexte, utiliser `tone="neutral"` pour le badge
imbriqué.

`text-faint` a maintenant été recalculé trois fois — `#5C6774` → `#868E98`
après un scan axe-core sur le Session Player pendant M1, `#868E98` →
`#9098A0` pour la palette Garmin, `#9686AC` → `#A093B8` pour la palette
M1.9 — même raison à chaque fois : un token de texte doit rester lisible
sur les quatre fonds de l'app, pas seulement dans le contexte où il a été
choisi au départ.

**Halos décoratifs (`.glow-card`, `src/index.css`)** : quelques cartes
"hero" (compte à rebours course, célébration post-séance, résumé
hebdomadaire) reçoivent un halo radial `primary`/`accent` à faible opacité
en arrière-plan, pour l'énergie visuelle demandée sans jamais placer de
texte directement sur une couleur saturée (ce qui casserait le contraste).
Plafonné à 16 % (`primary`) / 13 % (`accent`) — vérifié que `text` et
`text-muted` tiennent 4.5:1 même mélangés jusqu'à 20 %/15 % respectivement
sur `surface-raised`, donc marge de sécurité au réglage retenu. Ne jamais
monter ces pourcentages sans revérifier ce plafond.

Typographie : une pile de polices système déclarée volontairement
(`Inter, ui-sans-serif, system-ui, ...`) — pas de webfont chargée à
distance. Aucune dépendance réseau, aucun FOUT, dégradation propre si
`Inter` n'est pas installée. Nombres tabulaires (`tabular-nums`, utilitaire
Tailwind natif) partout où un chiffre est lu comme une colonne ou une
valeur qui bouge (chronomètre, allure, watts, RPE).

Rayons : `--radius-sm` (0.5rem, boutons/inputs/petites cartes),
`--radius-md` (0.75rem, cartes standards), `--radius-lg` (1rem, réservé
aux grands conteneurs). Un seul jeu de valeurs utilisé partout — plus de
`rounded-lg`/`rounded-md` Tailwind mélangés au hasard.

## Composants (`src/shared/components`)

- **Card** — le seul traitement de carte de l'app. Variants `default` /
  `muted` / `raised`. Polymorphe (`as="div" | "li"`) pour rester valide en
  HTML à l'intérieur d'une `<ul>`/`<ol>`.
- **Badge** — étiquette inline (priorité, phase, discipline). Le texte est
  toujours présent, la couleur ne porte jamais seule le sens.
- **StatTile** — un chiffre + son libellé + un indice optionnel, pour les
  écrans qui affichent des métriques scannées d'un coup d'œil (Progrès).
- **Field** — empile label/contrôle/indice de façon cohérente ; le contrôle
  réel (`input`/`textarea`) reste un enfant, donc chaque champ garde son
  propre type et comportement.
- **Button** / **LinkButton** — styles partagés via `buttonStyles.ts` ;
  `LinkButton` rend un vrai `<a>` (React Router `Link`) plutôt que
  d'imbriquer un lien dans un bouton (HTML invalide).
- **ChoiceGroup** — sélection à choix unique accessible, boutons radio
  natifs (`fieldset`/`legend`), zéro ARIA reconstruite à la main.
- **ProgressBar** — barre de progression déterminée (`role="progressbar"` +
  `aria-value*`), sans libellé visible : le `label` passé en prop porte le
  nom accessible. Utilisée pour le volume par discipline dans Progrès.
  (Le Session Player n'a plus de notion d'étape/décompte à mesurer — voir
  ci-dessous.)
- **AdaptationDecisionCard** — une décision du moteur d'adaptation
  (`AdaptationDecision`), toujours affichée avec son type (Badge), son
  éventuel changement concret ("70 min → 49 min") et sa justification en
  langage clair : jamais une mutation silencieuse (brief §28). Utilisée à
  la fois comme écran de résultat (séance manquée) et comme élément de
  liste (historique dans Progrès).
- `inputStyles.ts` (`INPUT_CLASSES`) — la classe partagée par tous les
  champs texte/nombre/date/textarea de l'app.
- `TriathlonBadgeIllustration` (`features/onboarding`) — l'unique
  illustration de l'app (écran d'accueil de l'onboarding), un SVG inline
  dessiné à la main plutôt qu'une image récupérée à distance : l'app est
  hors-ligne d'abord (`docs/architecture.md`), donc un visuel héro ne peut
  pas dépendre d'un hébergeur d'images tiers, et licencier une photo pour
  un seul écran ne se justifiait pas.

**Convention emoji** : quelques emoji ponctuels (disciplines, créneaux de
repas, moments de célébration) portent une partie du ton "explosif" sans
dépendre d'assets. Toujours ajoutés en dehors du texte exact vérifié par
un test (`getByText`/`getByRole` avec correspondance stricte côté Vitest +
Testing Library — contrairement à Playwright, la correspondance n'y est
**pas** un sous-texte par défaut) : soit dans une constante d'affichage
comme `DISCIPLINE_LABELS` (jamais utilisée comme clé ailleurs que pour
l'affichage), soit dans un élément `aria-hidden` séparé plutôt que
concaténé au texte d'un titre déjà couvert par un test.

## Ce qui n'a pas changé

La hiérarchie visuelle profonde de chaque écran (Today, Session Player,
Plan) arrive avec leurs milestones dédiés (M1.1–M1.3) — M1.0 établit le
système et l'applique partout où un remplacement mécanique améliore la
cohérence sans redessiner l'écran.

## Session Player : plus de chrono

Retour utilisateur après M1 : le décompte par étape supposait une
précision (le respect exact des secondes par bloc) que l'app n'a aucun
moyen de vérifier, et forçait à suivre l'écran en continu. Le Session
Player affiche maintenant toute la structure de la séance d'un coup —
comme la section "Structure" d'Aujourd'hui — avec une case à cocher par
bloc (aide-mémoire, pas une contrainte : elle ne bloque rien) et un bouton
unique "Séance effectuée" qui mène directement au formulaire de ressenti.
`useCountdown`, `StepPlayer` et `flattenSessionSteps` ont été supprimés
plutôt que laissés inutilisés.
