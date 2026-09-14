/**
 * Renders a pace stored as seconds-per-unit (per km, per 100m) as
 * "M:SS/unit" — the format an athlete actually reads a pace in, not a
 * raw second count they'd have to convert in their head.
 */
export function formatPaceMinSec(secondsPerUnit: number, unitSuffix: string): string {
  const rounded = Math.round(secondsPerUnit)
  const min = Math.floor(rounded / 60)
  const sec = rounded % 60
  return `${min}:${String(sec).padStart(2, '0')}${unitSuffix}`
}
