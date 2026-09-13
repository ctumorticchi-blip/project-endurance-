/**
 * Threshold running pace from a 20-minute time-trial distance — the
 * distance covered directly gives an average pace, used as-is rather than
 * scaled by an extra "confidence factor" that would only look more
 * precise without being more true (brief §34).
 */
export function computeThresholdPaceSecPerKm(distanceMeters: number, durationSec: number): number {
  const km = distanceMeters / 1000
  return Math.round(durationSec / km)
}
