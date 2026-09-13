/**
 * What actually happened, as opposed to `PlannedSession`. Every advanced
 * field is optional — M0 works with zero connected devices, and a field
 * only appears in the UI when it is actually present (brief §25/§33).
 */
export interface CompletedSession {
  id: string
  plannedSessionId: string
  completedAt: string

  actualDurationMin?: number
  actualDistanceMeters?: number

  avgHeartRate?: number
  maxHeartRate?: number

  // Bike
  avgPowerWatts?: number
  normalizedPowerWatts?: number
  avgCadenceRpm?: number

  // Run
  avgPaceSecPerKm?: number
  elevationGainM?: number
  avgCadenceSpm?: number

  // Swim
  avgPaceSecPer100m?: number
  swolf?: number
  strokeRate?: number
}

export function createCompletedSession(
  input: Omit<CompletedSession, 'id' | 'completedAt'>,
): CompletedSession {
  return { ...input, id: crypto.randomUUID(), completedAt: new Date().toISOString() }
}
