/**
 * Renders a minute count as "Xh Ymin" (or just one of the two when the
 * other is zero) instead of rounding to the nearest hour — a session or a
 * week's total is often not a round number of hours, and rounding it
 * hides real minutes (brief: no false precision).
 */
export function formatHoursAndMinutes(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes)
  const hours = Math.floor(rounded / 60)
  const minutes = rounded % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}
