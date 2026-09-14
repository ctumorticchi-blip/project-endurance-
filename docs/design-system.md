# Design System (M1.0)

Direction: premium, sportif, calme, précis (brief §39). Lisibilité avant
tout — pas de dashboard financier, pas de look gaming, pas d'avalanche de
graphiques.

## Tokens

Deux emplacements, gardés synchronisés à la main :

- `src/config/brand.ts` — source de vérité pour tout ce que le JS lit
  (couleurs, typographie, espacement, rayons, métadonnées).
- `src/index.css` (`@theme`) — les mêmes valeurs en variables CSS/utilitaires
  Tailwind, puisque Tailwind ne peut pas importer un module TS au build.

Palette (revue après M1, retour "style sportif" inspiration Garmin) : fond
bleu-marine très sombre (`#0D1B2A`), surfaces légèrement plus claires par
paliers de la même teinte (`surface` → `surface-muted` → `surface-raised`),
un bleu primaire (`#4EA1FF`, la couleur de marque/action — anciennement
l'accent) et un vert accent (`#3DDC97`, anciennement primaire — les deux
tons ont simplement échangé de rôle, leurs valeurs de contraste déjà
vérifiées restent valables), plus warning/danger (`danger` reteinté plus
clair, `#F2665C` → `#F5776D`, pour retenir 4.5:1 sur la nouvelle palette).
Texte en trois intensités (`text` / `text-muted` / `text-faint`) — jamais
d'information critique portée uniquement par la couleur.

**Toute la palette est revérifiée à chaque changement, pas seulement les
valeurs qu'on modifie explicitement** : changer le fond change le
contraste de tout ce qui est dessiné dessus. Avant de fixer les valeurs
ci-dessus, un script a recalculé le ratio WCAG de chaque paire texte/fond
(`text`/`text-muted`/`text-faint`/`primary`/`accent`/`warning`/`danger` ×
les quatre fonds) et de chaque bouton (couleur du label sur le fond du
bouton) — c'est ce qui a fait remonter `danger` de `#F2665C` à `#F5776D`
(l'ancienne valeur ne tenait plus 4.5:1 sur les nouvelles surfaces plus
claires) et fait passer l'alpha des `Badge` de 8 % à 6 %.

**Règle de contraste (Badge)** : chaque `Badge` teinté (`primary`/`accent`/
`warning`/`danger`) mélange sa couleur à 6 % au-dessus de son fond. Un
`Badge` n'apparaît jamais sur un seul fond : selon la `Card` qui l'entoure,
c'est `background`, `surface`, `surface-muted` ou `surface-raised` — les
quatre doivent tenir 4.5:1. Ce pourcentage n'est pas une constante figée :
il a déjà dû être recalculé deux fois (15 % → 8 % en M1 quand `danger`
échouait sur `surface-raised`, 8 % → 6 % avec la nouvelle palette Garmin)
et devra l'être à nouveau si une des quatre couleurs de fond ou une des
quatre tonalités change. Ne jamais recalibrer une seule tonalité
isolément : vérifier les quatre fonds pour les quatre tonalités avant de
changer l'alpha.

Ne jamais imbriquer un `Badge` teinté à l'intérieur d'un autre conteneur
déjà teinté de la même couleur (ex. une bannière `bg-accent/10`) : les deux
calques translucides s'additionnent, éclaircissent le fond composite, et
font échouer le contraste (mesuré 3.97:1 dans ce cas précis, à l'ancien
réglage 15 % — trouvé et corrigé via un scan axe-core réel, pas en lecture
de code). Dans ce contexte, utiliser `tone="neutral"` pour le badge
imbriqué.

`text-faint` a été recalculé une première fois (`#5C6774` → `#868E98`)
après un scan axe-core sur le Session Player pendant M1, puis une seconde
fois (`#868E98` → `#9098A0`) pour la palette Garmin — même raison à chaque
fois : un token de texte doit rester lisible sur les quatre fonds de
l'app, pas seulement dans le contexte où il a été choisi au départ.

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
