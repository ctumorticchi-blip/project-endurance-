# Gold Standard — athlète de référence Training Intelligence V2

Module : `src/simulation/goldStandardAthlete.ts` (fixture),
`src/simulation/goldStandard.test.ts` (15 invariants automatisés),
`src/simulation/benchmarkMatrix.test.ts` (15 scénarios nommés du brief §35).

## L'athlète de référence (brief §32)

- Triathlon Olympique (M), course le 2026-11-15.
- 16 semaines de préparation (aujourd'hui : 2026-07-27 — voir la note sur
  le calcul du nombre de semaines ci-dessous).
- Intermédiaire général, au moins un Sprint déjà couru
  (`triathlonExperience: 'some-races'`).
- Niveaux par discipline volontairement déséquilibrés : natation
  `beginner`, vélo `intermediate`, course `advanced` — pour que le Weekly
  Stimulus Composer ait un vrai travail à faire.
- ~6h/semaine, jusqu'à 6 jours (repos le lundi), accès piscine mardi/jeudi.
- Données complètes : FC max/seuil, FTP, CSS, allure seuil connues —
  athlète orienté performance, pas seulement "terminer la course".

**Note technique** : `generateTrainingPlan` compte les jours de façon
inclusive (`daysUntilRace + 1`) avant d'arrondir au nombre de semaines
supérieur. Pour obtenir exactement 16 semaines générées, la date "today" de
la fixture est fixée à 111 jours avant la course (pas un multiple exact de
7) — documenté directement dans `goldStandardAthlete.ts`.

## Résumé semaine par semaine (plan réellement généré, jamais codé en dur)

| Sem. | Phase | Charge | Points clés |
|---|---|---|---|
| 1-2 | Base | 171 | Ancre course (endurance 40min), ancre vélo (endurance 70min), **2 séances natation/semaine** (technique + endurance — la natation est le limiteur), renforcement complet (35min) |
| 3 | Base | 175 | Semaine de pointe du bloc base pour le travail technique natation (54min) |
| 4 | Base | 164 | Semaine deload : sorties longues allégées (course 45min, vélo 90min), natation et renforcement réduits |
| 5 | Base | 171 | Reprise du cycle base |
| 6 | Développement | 207 | Bascule : ancre natation devient CSS (55min) + rotation technique/endurance, ancre course devient tempo (45min), ancre vélo devient sweet spot (65min) |
| 7 | Développement | 204 | Même charge, structure différente (répétitions courtes CSS/sweet spot) — vraie diversification, pas juste une répétition |
| 8 | Développement | 226 | Semaine de pointe du bloc : CSS 55min, tempo 50min, sweet spot 77min ; rotation secondaire vélo atteint le VO2max (60min) |
| 9 | Développement | 148 | Deload complet du bloc |
| 10 | Développement | 207 | Reprise du cycle |
| 11 | Spécifique | 230 | Bascule vers le seuil sur les trois disciplines (natation 60min, course 50min, vélo 70min) |
| 12 | Spécifique | 268 | Semaine de pointe + **vrai brick vélo-course de 60min** (`BRICK_ADAPTATION`, `sessionType: 'brick'`) — seule semaine du bloc avec un brick, comme prévu (une semaine sur deux) |
| 13 | Spécifique | 244 | Semaine de pointe (sans brick), rotation secondaire vélo/course atteint VO2max/récupération |
| 14-15 | Affûtage | 130 → 107 | Volume et intensité décroissants de façon monotone, sessions explicitement étiquetées "(allégée)"/"(très allégée)" |
| 16 | Course | 69 | Semaine la plus légère du plan entier — uniquement des séances de récupération, aucune séance clé |

## Résultat de la revue manuelle (brief §34)

La lecture complète du plan (pas seulement les 15 invariants automatisés) a
trouvé **trois défauts réels de coaching**, tous corrigés dans le moteur
avec un test de non-régression — détaillés dans
`docs/coaching-methodology.md`'s Coaching Defect Log :

1. Le brick dégradait systématiquement en séance de transition de 30min
   (jamais un vrai brick).
2. Le renforcement recevait toujours la version allégée (20min), jamais la
   version complète (35min), même en base/développement.
3. La natation — le vrai limiteur de cet athlète — ne recevait qu'une
   séance/semaine, identique à un nageur déjà fort.

Après correction, le plan répond positivement aux questions du brief §34
pour chaque semaine : charge réaliste et progressive par bloc, équilibre
des disciplines cohérent avec le limiteur identifié (natation), séances
clé protégées (2 par semaine hors affûtage/course), récupération suffisante
(deload toutes les 4 semaines en base/développement), pas d'empilement
d'intensité (brick jamais la même semaine qu'un VO2max), natation faible
effectivement adressée (2 touches/semaine la plupart des semaines, jamais
moins qu'un athlète équilibré), course forte maintenue sans gaspillage
(1 séance clé/semaine hors affûtage plutôt que 2), spécificité croissante
(seuil puis brick en phase spécifique), affûtage cohérent (décroissance
monotone, semaine de course la plus légère de tout le plan).

## Invariants automatisés (`goldStandard.test.ts`)

16 semaines exactement, phases dans l'ordre course-à-rebours, affûtage sur
2 semaines (standard Olympique), aucune séance ne dépasse la disponibilité
du jour, aucune séance à/après la date de course, au moins une séance clé
par semaine hors semaine de course, l'affûtage et la semaine de course
réduisent la charge par rapport au pic, le brick n'apparaît qu'en phase
spécifique et pas toutes les semaines, le limiteur (natation) et la
discipline la plus forte (course) sont correctement identifiés, les trois
disciplines core sont couvertes, la charge évolue semaine à semaine en
développement (pas de répétition identique), aucune durée négative/nulle,
chaque phase core obtient au moins une semaine complète, le volume
hebdomadaire ne dépasse jamais la disponibilité déclarée hors
affûtage/course, chaque semaine a un libellé de phase en français.

## Matrice de benchmark (`benchmarkMatrix.test.ts`, brief §35)

15 scénarios nommés — l'entrée 03 *est* l'athlète Gold Standard ci-dessus,
non dupliquée dans la matrice. Chaque scénario vérifie uniquement
l'affirmation de coaching précise qu'il existe pour prouver (brief §47 :
qualité de la décision sous-jacente, pas exhaustivité de la suite) :

01 Sprint débutant 3h/sem (progression prudente, budget court) · 02 Sprint
intermédiaire 5h/sem (vraie progression d'intensité) · 04 coureur fort/
nageur faible (natation plus fréquente que la course) · 05 cycliste fort/
coureur faible (limiteur et discipline forte correctement inversés) · 06
seulement 4 jours d'entraînement (les trois disciplines core restent
représentées) · 07 natation possible seulement 2 jours fixes (toutes les
séances natation y atterrissent) · 08 départ à 6 semaines de la course
(avertissement de délai court) · 09 départ à 20+ semaines (vraie
périodisation, pas un bloc base géant) · 10 complétion répétée de 4/6
séances (écart de capacité détecté avec évidence répétée) · 11 RPE élevé
persistant (réduction de charge basée sur la tendance, pas un point isolé)
· 12 progression plus rapide que prévu (PROGRESS puis RECALIBRATE sur
évidence répétée) · 13 semaine contrainte par un déplacement (séance clé
protégée ou raccourcie, jamais silencieusement perdue) · 14 semaine sans
piscine (temps réalloué vélo/course, pas de natation inventée) · 15
perturbation en semaine de course (protection d'affûtage active).
