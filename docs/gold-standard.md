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

## Résumé semaine par semaine (plan réellement généré par V2.1, jamais codé en dur)

| Sem. | Phase | Charge | Points clés |
|---|---|---|---|
| 1-2 | Base | 188 | Ancre course (endurance 40min), **ancre vélo `long` 75min réellement atteinte** (voir défaut n°8), 2 séances natation/semaine (technique + endurance — la natation est le limiteur), renforcement complet (35min) |
| 3 | Base | 192 | Semaine de pointe du bloc base pour le travail technique natation (54min) |
| 4 | Base | 177 | Semaine deload : sorties longues allégées (course 45min, vélo 90min), natation et renforcement réduits |
| 5 | Base | 188 | Reprise du cycle base |
| 6 | Développement | 220 | Bascule : ancre natation devient CSS (55min) + rotation technique/endurance, ancre course devient tempo (45min), ancre vélo devient sweet spot (65min) |
| 7 | Développement | 217 | Même charge, structure différente (répétitions courtes CSS/sweet spot) — vraie diversification, pas juste une répétition |
| 8 | Développement | 239 | Semaine de pointe du bloc : CSS 55min, tempo 50min (pointe), sweet spot 77min (pointe) ; touche secondaire vélo reste `endurance` — **le VO2max n'est plus empilé sur l'ancre déjà montée** (défaut n°7, voir audit dédié ci-dessous) |
| 9 | Développement | 161 | Deload complet du bloc |
| 10 | Développement | 220 | Reprise du cycle |
| 11 | Spécifique | 233 | Bascule vers le seuil sur les trois disciplines (natation 60min, course 50min, vélo 70min) + brick `BRICK_ADAPTATION` (transition, 30min) — voir audit dédié ci-dessous |
| 12 | Spécifique | 284 | Semaine de pointe + brick `BRICK_SPECIFIC` (90min, "Brick race-specific") |
| 13 | Spécifique | 285 | Semaine de pointe + brick `BRICK_RACE_REHEARSAL` (90min, "Répétition générale (format réaliste)") — **désormais visiblement différent** de la semaine 12 (défaut n°9) |
| 14 | Affûtage | 130 | Ancres allégées + **touche secondaire vélo récupération présente** (défaut n°10) |
| 15 | Affûtage | 107 | Décroissance monotone confirmée (130 → 107) |
| 16 | Course | 41 | Semaine la plus légère du plan — **les trois disciplines représentées** en récupération (natation/course/vélo), défaut n°10 |

## Résultat de la revue manuelle V2 (brief §34)

La première revue (Training Intelligence V2) avait trouvé trois défauts
réels, tous corrigés — voir `docs/coaching-methodology.md`'s Coaching
Defect Log n°1-3 (brick dégradant en transition, renforcement toujours
allégé, natation limiteur plafonnée à 1 séance/semaine).

## Audit de coaching approfondi V2.1 (brief §15-§22) — revue séance par séance

Cette deuxième revue est allée au niveau de la séance individuelle (pas
seulement la semaine), sur les 16 semaines, avec deux audits nommément
demandés par le brief et plusieurs audits thématiques transversaux. **Sept
nouveaux défauts réels** ont été trouvés et corrigés dans le moteur, jamais
en patchant une semaine précise — détail complet (scénario/cause
racine/correction/test) dans le Coaching Defect Log n°4-10 de
`docs/coaching-methodology.md`.

### Semaine 8 (brief §16 — "ne pas préserver ceci automatiquement, ne pas cas-particulariser la semaine 8")

**Avant correction** : CSS natation (55min) + tempo course (50min, pointe)
+ Sweet Spot vélo (77min, pointe) + **VO2max vélo (60min) en touche
secondaire** — deux séances vélo indépendamment exigeantes la même
semaine que les deux autres disciplines sont déjà à leur type le plus dur
du bloc. Conclusion : **excessif**, confirmé par les métriques internes
(`quality`/`highcost` au maximum du plan). Corrigé au niveau du moteur
(défaut n°7) : la touche secondaire vélo redevient `endurance` sur une
semaine `peak` quand le registre des familles marque son type candidat
incompatible avec l'ancre déjà montée — une règle générale, jamais un cas
particulier de cette semaine (vérifiée sur 8 cycles complets dans
`buildWeekSessions.test.ts`).

### Semaine 11 (brief §17 — "ne pas patcher la semaine 11, corriger la règle générale du moteur si incohérent")

Seuil natation (60min) + seuil course (50min) + seuil vélo (70min) la même
semaine, plus un brick d'adaptation (30min) et un renforcement allégé
(20min). **Conclusion : cohérent, pas un défaut.** Analyse : le seuil
course et le seuil natation tombent sur des jours consécutifs (mardi/
mercredi) mais aucune métadonnée `incompatibleNeighbors` ne les marque
incompatibles (systèmes largement indépendants) ; le seuil vélo est
ensuite séparé du seuil course par 3 jours réels (mercredi → samedi), avec
une technique natation légère et un brick d'adaptation à faible coût de
fatigue interposés entre les deux — un vrai espacement de récupération,
pas un empilement aveugle. C'est la première semaine de la phase
spécifique, donc la charge la plus élevée du plan (`highcost~=3`) à ce
stade est attendue : la phase spécifique existe précisément pour
introduire ce niveau de spécificité. Aucune correction nécessaire ; aucun
cas particulier ajouté.

### Développement vélo long (brief §18)

**Défaut réel trouvé** (n°8) : l'ancre `long` vélo était structurellement
inatteignable pour un athlète réaliste (~6h/semaine, plus grand jour à
90min) — tous les gabarits `standard`/`peak` dépassent 150min. Corrigé par
un nouveau gabarit `bike-long-compact` (75min) ; l'ancre `long` apparaît
désormais réellement chaque semaine de base non-deload.

### Durabilité course (brief §19)

**Défaut réel trouvé**, lié au précédent (n°8) : vélo et course
réclamaient tous les deux le "grand jour" de la semaine pour leur ancre
`long`, et l'ancien départage (durée médiane du catalogue) favorisait
toujours le vélo, y compris pour un athlète dont la course serait le
limiteur — ce qui aurait dû inverser le résultat. Corrigé en rendant le
départage sensible à l'analyse limiteur/plus-forte de l'athlète. Pour
*cet* athlète (course = discipline la plus forte), le résultat final ne
change pas (le vélo continue de recevoir le grand jour) — c'est la bonne
décision de coaching, mais désormais pour la bonne raison, vérifiée en
inversant limiteur/plus-forte dans un test dédié.

### Contenu qualitatif natation (brief §20)

Structurellement cohérent avec le statut de limiteur : base = technique +
endurance (aucune intensité type intervalle) ; développement = CSS (ancre)
+ rotation technique/endurance biaisée développement (jamais l'entrée haut
de gamme "intervals" de la rotation générique) ; spécifique = seuil +
technique/endurance. Un garde-fou générique supplémentaire a été ajouté
lors de cet audit (défaut n°7's première partie) : aucune rotation ne peut
plus renvoyer le même type que l'ancre de la semaine, ce qui aurait pu
produire une double séance CSS certaines semaines pour cet athlète-limiteur
avec un phasage différent (latent, jamais observé sur ce Gold Standard
précis grâce à un alignement de cycle qui l'empêchait par coïncidence —
documenté comme limitation connue plutôt que supposé sûr indéfiniment).

### Suffisance de la progression brick (brief §21)

**Défaut réel trouvé** (n°9) : la semaine médiane (`BRICK_SPECIFIC`) et la
dernière semaine (`BRICK_RACE_REHEARSAL`) produisaient la séance
identique — l'escalade à 3 étages promise était illusoire pour un athlète
réaliste. Corrigé (nouveau gabarit `brick-race-rehearsal-compact` +
sélection de palier par étage plutôt que par semaine). **Conclusion sur la
suffisance** : avec la correction, la phase spécifique de 3 semaines de cet
athlète produit une vraie escalade (transition 30min → brick complet 90min
→ répétition générale 90min qualitativement différente) — 3 expositions
progressives sur 3 semaines est cohérent pour une phase spécifique courte ;
un athlète avec une phase spécifique plus longue recevrait mécaniquement
plus de répétitions `BRICK_SPECIFIC` entre les deux bornes (`weekIndexInPhase % 2 === 1`),
donc la suffisance croît avec la durée du plan plutôt que d'être plafonnée
à 3 dans l'absolu.

### Cohérence de l'affûtage (brief §22, semaines 14-16)

**Défaut réel trouvé** (n°10, le plus impactant de cet audit) : le vélo
disparaissait entièrement de la semaine de course, et sa touche secondaire
de récupération disparaissait aussi en affûtage — pas un réglage fin de
coaching mais un trou de registre (`BIKE_RECOVERY` n'existait pas). Corrigé
; les semaines 14-16 couvrent désormais les trois disciplines. Le reste de
l'affûtage était déjà cohérent : décroissance monotone de charge (188 pic
→ 130 → 107 → 41), volumes et intensités explicitement étiquetés
"(allégé/allégée)"/"(très allégé/allégée)", strength jamais forcé (palier
allégé), semaine de course la plus légère du plan entier.

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
