import type { PlannedSession, SessionType } from '@/core/training/PlannedSession'

/**
 * Relative training load, not a certified TSS/TRIMP score — deliberately
 * simple and named so it stays decomposable and explainable (brief §34: no
 * false precision). `load = estimatedDurationMin * intensityFactor`, where
 * the intensity factor is a fixed, documented table keyed by session type.
 */
export const INTENSITY_FACTOR: Record<SessionType, number> = {
  recovery: 0.5,
  technique: 0.5,
  mobility: 0.4,
  endurance: 0.7,
  long: 0.7,
  'sweet-spot': 0.85,
  tempo: 0.85,
  threshold: 1.0,
  css: 1.0,
  brick: 1.0,
  transition: 0.6,
  vo2max: 1.2,
  intervals: 1.2,
  'race-specific': 1.1,
  strength: 0.6,
}

export function estimateSessionLoad(session: PlannedSession): number {
  return Math.round(session.estimatedDurationMin * INTENSITY_FACTOR[session.sessionType])
}

export function estimateWeekLoad(sessions: PlannedSession[]): number {
  return sessions.reduce((sum, s) => sum + estimateSessionLoad(s), 0)
}

export function estimateLoadByDiscipline(
  sessions: PlannedSession[],
): Partial<Record<PlannedSession['discipline'], number>> {
  const byDiscipline: Partial<Record<PlannedSession['discipline'], number>> = {}
  for (const session of sessions) {
    byDiscipline[session.discipline] =
      (byDiscipline[session.discipline] ?? 0) + estimateSessionLoad(session)
  }
  return byDiscipline
}
