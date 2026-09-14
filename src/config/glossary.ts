/**
 * Every technical term that actually appears somewhere in the app (session
 * labels, notes, zone names) — not a generic sports dictionary. Kept here,
 * not scattered as inline tooltips, so it stays a single source someone
 * can search rather than hunting screen by screen (brief feedback: explain
 * RPE, catch-up, trailing fingers, etc.).
 */
export interface GlossaryEntry {
  term: string
  definition: string
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    term: 'Allure',
    definition: 'La vitesse de déplacement en course à pied ou en natation, exprimée en temps par distance (par exemple min/km ou min/100m) plutôt qu\'en vitesse.',
  },
  {
    term: 'Brick',
    definition: 'Une séance qui enchaîne vélo puis course à pied sans grande pause, pour habituer les jambes à la sensation particulière de courir juste après avoir pédalé.',
  },
  {
    term: 'Catch-up',
    definition: 'Un éducatif de natation où un bras reste tendu devant en attendant que l\'autre termine complètement son mouvement avant de repartir à son tour.',
  },
  {
    term: 'CSS (Critical Swim Speed)',
    definition: 'Ton allure de nage soutenable indéfiniment. Déterminée par un test 400m + 200m qui compare tes deux temps.',
  },
  {
    term: 'Doigts traînants',
    definition: 'Un éducatif de natation où les doigts frôlent la surface de l\'eau pendant la phase aérienne du mouvement, pour travailler le rythme et la technique de retour de bras.',
  },
  {
    term: 'Éducatifs',
    definition: 'Des exercices de technique de nage (catch-up, doigts traînants, respiration bilatérale...) réalisés à faible intensité pour améliorer la nage plutôt que l\'endurance.',
  },
  {
    term: 'Fentes',
    definition: 'Exercice de renforcement musculaire : un grand pas en avant en pliant les deux genoux, utilisé pour le bas du corps.',
  },
  {
    term: 'Footing',
    definition: 'Une course à pied à allure facile, généralement en zone Z1 ou Z2 — l\'inverse d\'une séance de fractionné.',
  },
  {
    term: 'Fractionné',
    definition: 'Une séance faite de répétitions d\'efforts intenses séparées par des phases de récupération, plutôt qu\'un effort continu.',
  },
  {
    term: 'FTP (Functional Threshold Power)',
    definition: 'La puissance moyenne, en watts, que tu peux maintenir à vélo pendant environ une heure. Sert de référence pour calculer tes zones de puissance.',
  },
  {
    term: 'Gainage',
    definition: 'Des exercices de renforcement des muscles profonds du tronc (abdominaux, lombaires) qui stabilisent le corps pendant l\'effort — planche, pont fessier, etc.',
  },
  {
    term: 'Planche (latérale)',
    definition: 'Exercice de gainage statique en appui sur les avant-bras (ou sur un avant-bras pour la version latérale), corps aligné, sans bouger.',
  },
  {
    term: 'Pont fessier',
    definition: 'Exercice de renforcement allongé sur le dos, qui consiste à lever le bassin en contractant les fessiers.',
  },
  {
    term: 'Respiration bilatérale',
    definition: 'En natation, le fait de respirer alternativement des deux côtés (par exemple tous les 3 mouvements de bras) plutôt que toujours du même côté.',
  },
  {
    term: 'Roulage',
    definition: 'Un terme courant pour désigner une sortie ou une séance à vélo.',
  },
  {
    term: 'RPE (Rate of Perceived Exertion)',
    definition: 'Ton ressenti de l\'intensité d\'un effort, sur une échelle de 1 (très facile) à 10 (effort maximal). Utile quand tu n\'as pas de capteur (cardio, puissance), et complémentaire même quand tu en as un.',
  },
  {
    term: 'Seuil',
    definition: 'L\'intensité que tu peux tenir pendant environ une heure avant que la fatigue ne t\'oblige à ralentir — la frontière entre un effort "difficile mais soutenable" et un effort qui se dégrade rapidement. Correspond à la zone Z4.',
  },
  {
    term: 'Sweet Spot',
    definition: 'Une zone d\'intensité à vélo juste sous le seuil (environ 88 à 94 % de la FTP) qui apporte un bon stimulus d\'entraînement sans fatigue excessive, permettant d\'en faire plus souvent qu\'un travail au seuil.',
  },
  {
    term: 'T1 / T2',
    definition: 'Les deux transitions d\'un triathlon : T1 (natation → vélo) et T2 (vélo → course à pied). Se travaillent à l\'entraînement pour gagner du temps et des sensations le jour de la course.',
  },
  {
    term: 'Tempo',
    definition: 'Une intensité "confortablement difficile" : plus soutenue qu\'un footing facile, mais en dessous du seuil. Correspond à la zone Z3.',
  },
  {
    term: 'VO2max',
    definition: 'La quantité maximale d\'oxygène que ton corps peut utiliser à l\'effort. Les séances "VO2max" sont de courts efforts très intenses (zone Z5) qui développent cette capacité.',
  },
  {
    term: 'Zones (Z1 à Z5)',
    definition: 'Un découpage de l\'intensité d\'effort en 5 paliers, du plus facile au plus dur : Z1 Récupération, Z2 Endurance, Z3 Tempo, Z4 Seuil, Z5 VO2max+. Calculées à partir de tes données connues (FC, FTP, CSS, allure seuil) dans ton profil.',
  },
]
