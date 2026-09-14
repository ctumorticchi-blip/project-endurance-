import type { BiologicalSex } from '@/core/athlete/AthleteProfile'

export interface PowerToWeightResult {
  /** FTP watts / body weight kg, rounded to 2 decimals. */
  wattsPerKg: number
  /**
   * A coarse population-average reference band, only present when `sex` is
   * `'male'` or `'female'` — 'unspecified' (or omitted) skips the label
   * entirely rather than guessing which table to use. Never a judgment on
   * the individual: two riders of the same sex and W/kg can differ hugely
   * in what actually matters for racing (aerodynamics, pacing, terrain).
   */
  category?: string
}

interface Band {
  min: number
  label: string
}

/**
 * Widely-cited, publicly documented FTP W/kg reference bands from
 * power-based cycling training literature (the kind of chart printed in
 * most power-meter training guides). Split by sex because average
 * power-to-weight differs by typical body composition at the population
 * level — not a claim about any individual. Deliberately coarse and
 * labeled as such (brief "pas de fausse science", docs/metrics.md): the
 * raw W/kg number is always shown alongside the label, so nothing here is
 * hidden or unverifiable. Never shown unless the athlete has declared both
 * an FTP and a body weight.
 */
const MALE_BANDS: Band[] = [
  { min: 0, label: 'Débutant' },
  { min: 2.0, label: 'Occasionnel' },
  { min: 2.8, label: 'Intermédiaire' },
  { min: 3.5, label: 'Confirmé' },
  { min: 4.2, label: 'Avancé' },
  { min: 5.0, label: 'Élite' },
]

const FEMALE_BANDS: Band[] = [
  { min: 0, label: 'Débutant' },
  { min: 1.7, label: 'Occasionnel' },
  { min: 2.4, label: 'Intermédiaire' },
  { min: 3.0, label: 'Confirmé' },
  { min: 3.6, label: 'Avancé' },
  { min: 4.3, label: 'Élite' },
]

function categoryFor(wattsPerKg: number, sex: BiologicalSex | undefined): string | undefined {
  if (sex !== 'male' && sex !== 'female') return undefined
  const bands = sex === 'female' ? FEMALE_BANDS : MALE_BANDS
  let label = bands[0]!.label
  for (const band of bands) {
    if (wattsPerKg >= band.min) label = band.label
  }
  return label
}

/** Returns undefined when either input is missing or not usable — this is
 * never fabricated from partial data. */
export function calculatePowerToWeight(
  ftpWatts: number | undefined,
  weightKg: number | undefined,
  sex: BiologicalSex | undefined,
): PowerToWeightResult | undefined {
  if (!ftpWatts || !weightKg) return undefined
  const wattsPerKg = Math.round((ftpWatts / weightKg) * 100) / 100
  return { wattsPerKg, category: categoryFor(wattsPerKg, sex) }
}
