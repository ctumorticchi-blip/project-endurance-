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

Palette : fond très sombre (`#0B0F14`), surfaces légèrement plus claires
par paliers (`surface` → `surface-muted` → `surface-raised`), un vert
primaire (`#3DDC97`) et un bleu accent (`#4EA1FF`), plus warning/danger.
Texte en trois intensités (`text` / `text-muted` / `text-faint`) — jamais
d'information critique portée uniquement par la couleur.

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
- `inputStyles.ts` (`INPUT_CLASSES`) — la classe partagée par tous les
  champs texte/nombre/date/textarea de l'app.

## Ce qui n'a pas changé

La hiérarchie visuelle profonde de chaque écran (Today, Session Player,
Plan) arrive avec leurs milestones dédiés (M1.1–M1.3) — M1.0 établit le
système et l'applique partout où un remplacement mécanique améliore la
cohérence sans redessiner l'écran.
