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
