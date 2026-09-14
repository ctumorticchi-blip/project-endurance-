# Metrics

## Principe : précision réelle, jamais fausse précision

Les données ne sont **jamais simplifiées uniquement pour faciliter
l'interface** — on réduit la complexité nécessaire pour les *comprendre*,
pas les données elles-mêmes. Une métrique n'est affichée que si elle existe
ou est pertinente pour la séance/le profil concerné (ex. pas de puissance
sans capteur, pas de CSS sans test natation).

Interdiction de créer une fausse précision scientifique (ex. un score du
type « Race readiness : 87,4 % ») sans méthodologie défendable. Tout score
synthétique doit être documenté, décomposable et explicable dans l'UI.

## Métriques par discipline

**Course à pied** : allure, allure cible, FC, zones FC, distance, durée,
cadence, dénivelé, RPE.

**Vélo** : puissance, puissance normalisée, FTP, %FTP, zones de puissance,
FC, cadence, vitesse, distance, RPE.

**Natation** : distance, allure /100m, CSS, séries, récupérations, SWOLF,
stroke rate.

**Renforcement** : exercices, séries, répétitions, durée, RPE.

Toutes les données avancées (puissance, cadence, SWOLF...) restent
**facultatives** — M0 fonctionne intégralement sans montre ni capteur
connecté.

## Biométrie (`AthleteProfile.biometrics`)

Sexe, taille, poids — demandés une fois à l'onboarding, **toujours
facultatifs** (brief §20), jamais utilisés pour un diagnostic ou un
jugement de composition corporelle. Deux usages concrets seulement,
chacun documenté et décomposable :

- **Nutrition par heure d'effort** (`config/nutritionGuidance.ts`) : le
  poids convertit les fourchettes génériques de glucides/hydratation
  (largement citées en nutrition sportive d'endurance, en g ou ml par kg
  et par heure) en une fourchette calculée pour l'athlète, plutôt qu'une
  fourchette uniquement basée sur la durée. Sans poids déclaré, le
  générateur retombe sur la fourchette générique d'origine.
- **Puissance relative** (`engine/calibration/powerToWeight.ts`) : FTP ÷
  poids = W/kg, affiché tel quel. Si le sexe est déclaré (homme/femme), un
  intitulé de catégorie approximatif (tableau public de référence de
  l'entraînement à la puissance, différent par sexe) est ajouté à côté du
  chiffre brut — jamais à la place. « Non précisé » n'affiche aucune
  catégorie plutôt que d'en deviner une.

La taille est conservée dans le profil mais ne pilote aucun calcul pour
le moment — pas de calcul d'IMC ni de catégorisation liée au poids/à la
taille : ce type de score n'a pas d'usage défendable pour l'entraînement
et risquerait de contredire la règle « pas de diagnostic » ci-dessus.

## Calibration

Ordre de confiance : **donnée connue déclarée > estimation prudente > test
terrain > historique**. Tests terrain prévus : test seuil course, test FTP
vélo, test CSS natation (M0.10, `engine/calibration`). Les zones peuvent
évoluer, mais **une seule séance ne doit pas provoquer une recalibration
majeure**, et toute modification de zone doit être expliquée.

## Charge et tendances

Le moteur distingue systématiquement **volume**, **intensité** et
**spécificité**. La charge est calculée par discipline et globalement,
utilisée en entrée du moteur d'adaptation (`engine/metrics`,
`engine/adaptation`) — jamais comme diagnostic médical.

## Historique longitudinal

Dès M0, l'historique est conservé proprement (séances planifiées vs
réalisées, feedback, calibrations successives) pour permettre plus tard
(M4+) des analyses de tendance sur plusieurs mois/années. M0 n'implémente
**pas** d'algorithmes prétendant tirer des conclusions que les données de
quelques semaines ne permettent pas raisonnablement.
