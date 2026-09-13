import type { ReadinessLevel } from '@/core/history/ReadinessCheck'
import type { MissedReason, SessionFeedback } from '@/core/history/SessionFeedback'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { DateISO } from '@/shared/types/common'
import type { AdaptationDecision, AdaptationSnapshot, ReasonCode } from './AdaptationDecision'

/** How many recent feedback entries count towards a trend — a single data
 * point is never enough to change the plan (brief §18/§27). */
const RECENT_WINDOW = 3
const MIN_ENTRIES_FOR_TREND = 2

const HIGH_RPE_THRESHOLD = 8
const LOW_RPE_THRESHOLD = 4
/** Never let a reduction erase the point of doing the session at all. */
const MIN_SESSION_MINUTES = 5

const REDUCE_FACTOR_KEY_TIRED = 0.85
const REDUCE_FACTOR_NONKEY_TIRED = 0.7
const REDUCE_FACTOR_HIGH_RPE = 0.8
const INCREASE_FACTOR_LOW_RPE = 1.1
const REPLACE_FACTOR_NO_SLOT = 0.7

export interface AvailableSlot {
  date: DateISO
  minutes: number
}

export interface AdaptationContext {
  session: PlannedSession
  /** Today's pre-session check-in, if the athlete did one. */
  readiness?: ReadinessLevel
  /** Most-recent-first feedback history, any discipline. */
  recentFeedback: SessionFeedback[]
  /** Present only when this call is deciding what to do about a session
   * that was just declared missed. */
  missedReason?: MissedReason
  /** Future slots with spare capacity, earliest first — used for MOVE. */
  upcomingAvailability?: AvailableSlot[]
}

function scaleMinutes(minutes: number, factor: number): number {
  return Math.max(MIN_SESSION_MINUTES, Math.round(minutes * factor))
}

function decision(
  session: PlannedSession,
  type: AdaptationDecision['type'],
  reasons: ReasonCode[],
  before: AdaptationSnapshot,
  after: AdaptationSnapshot,
  explanation: string,
): AdaptationDecision {
  return { type, sessionId: session.id, reasons, before, after, explanation }
}

function pickMoveSlot(slots: AvailableSlot[], neededMinutes: number): AvailableSlot | undefined {
  return slots.find((slot) => slot.minutes >= neededMinutes)
}

function averageRpe(feedback: SessionFeedback[]): number | undefined {
  const withRpe = feedback.filter((f) => f.rpe !== undefined).slice(0, RECENT_WINDOW)
  if (withRpe.length < MIN_ENTRIES_FOR_TREND) return undefined
  const sum = withRpe.reduce((total, f) => total + (f.rpe ?? 0), 0)
  return sum / withRpe.length
}

function decideMissedSession(
  session: PlannedSession,
  missedReason: MissedReason,
  upcomingAvailability: AvailableSlot[],
): AdaptationDecision {
  const before: AdaptationSnapshot = { estimatedDurationMin: session.estimatedDurationMin, date: session.date }

  if (missedReason === 'pain') {
    return decision(
      session,
      'REMOVE',
      ['PAIN_REPORTED'],
      before,
      before,
      "Séance retirée : une douleur n'est pas traitée comme une simple fatigue. Si elle persiste, un avis professionnel est recommandé avant de reprendre ce type d'effort.",
    )
  }

  if (session.priority === 'optional') {
    return decision(
      session,
      'REMOVE',
      ['LOW_PRIORITY_SESSION'],
      before,
      before,
      "Séance complémentaire retirée : elle n'était pas prioritaire, inutile de la rattraper.",
    )
  }

  if (session.priority === 'secondary') {
    return decision(
      session,
      'REMOVE',
      ['LOW_PRIORITY_SESSION'],
      before,
      before,
      "Séance secondaire retirée du programme plutôt qu'ajoutée aux séances suivantes.",
    )
  }

  // priority === 'key'
  const slot = pickMoveSlot(upcomingAvailability, session.estimatedDurationMin)
  if (slot) {
    return decision(
      session,
      'MOVE',
      ['KEY_SESSION_PROTECTED'],
      before,
      { estimatedDurationMin: session.estimatedDurationMin, date: slot.date },
      `Séance clé déplacée au ${slot.date} : elle reste importante pour ta progression, sans s'ajouter aux séances déjà prévues demain.`,
    )
  }

  const shortenedMinutes = scaleMinutes(session.estimatedDurationMin, REPLACE_FACTOR_NO_SLOT)
  return decision(
    session,
    'REPLACE',
    ['KEY_SESSION_PROTECTED', 'NO_AVAILABLE_SLOT'],
    before,
    { estimatedDurationMin: shortenedMinutes, date: session.date },
    "Pas de créneau libre pour déplacer cette séance clé : elle est remplacée par une version raccourcie plutôt que perdue.",
  )
}

function decideUpcomingSession(
  session: PlannedSession,
  readiness: ReadinessLevel | undefined,
  recentFeedback: SessionFeedback[],
): AdaptationDecision {
  const before: AdaptationSnapshot = { estimatedDurationMin: session.estimatedDurationMin }
  const avgRpe = averageRpe(recentFeedback)

  if (readiness === 'tired') {
    const factor = session.priority === 'key' ? REDUCE_FACTOR_KEY_TIRED : REDUCE_FACTOR_NONKEY_TIRED
    const afterMinutes = scaleMinutes(session.estimatedDurationMin, factor)
    return decision(
      session,
      'REDUCE',
      ['ELEVATED_FATIGUE'],
      before,
      { estimatedDurationMin: afterMinutes },
      `Séance réduite de ${before.estimatedDurationMin} à ${afterMinutes} min car tu as signalé de la fatigue aujourd'hui.`,
    )
  }

  if (avgRpe !== undefined && avgRpe >= HIGH_RPE_THRESHOLD) {
    const afterMinutes = scaleMinutes(session.estimatedDurationMin, REDUCE_FACTOR_HIGH_RPE)
    return decision(
      session,
      'REDUCE',
      ['HIGH_RECENT_RPE'],
      before,
      { estimatedDurationMin: afterMinutes },
      `Séance réduite de ${before.estimatedDurationMin} à ${afterMinutes} min : ton RPE moyen récent (${avgRpe.toFixed(1)}) est élevé.`,
    )
  }

  if (readiness === 'great' && avgRpe !== undefined && avgRpe <= LOW_RPE_THRESHOLD && session.priority !== 'optional') {
    const afterMinutes = Math.round(session.estimatedDurationMin * INCREASE_FACTOR_LOW_RPE)
    return decision(
      session,
      'INCREASE',
      ['HIGH_READINESS', 'LOW_RECENT_RPE'],
      before,
      { estimatedDurationMin: afterMinutes },
      `Séance légèrement augmentée de ${before.estimatedDurationMin} à ${afterMinutes} min : tu te sens très bien et ton RPE récent est bas.`,
    )
  }

  if (avgRpe === undefined && readiness === undefined) {
    return decision(
      session,
      'KEEP',
      ['INSUFFICIENT_HISTORY'],
      before,
      before,
      'Séance inchangée : pas encore assez de données pour ajuster.',
    )
  }

  return decision(
    session,
    'KEEP',
    ['NO_SIGNAL'],
    before,
    before,
    'Séance inchangée : rien dans tes signaux récents ne justifie un ajustement.',
  )
}

/**
 * Single entry point for the adaptation engine. Two modes, chosen by
 * whether `missedReason` is present:
 *  - a session about to happen: adjusts intensity/volume from today's
 *    readiness check-in and a short recent-RPE trend (KEEP/REDUCE/INCREASE);
 *  - a session just declared missed: decides whether it can be protected
 *    (MOVE/REPLACE) or safely dropped (REMOVE) — never silently piled onto
 *    the next session (brief §29: no automatic training debt).
 */
export function decideAdaptation(context: AdaptationContext): AdaptationDecision {
  const { session, readiness, recentFeedback, missedReason, upcomingAvailability = [] } = context

  if (missedReason) {
    return decideMissedSession(session, missedReason, upcomingAvailability)
  }

  return decideUpcomingSession(session, readiness, recentFeedback)
}

/**
 * A same-day availability exception ("j'ai moins de temps aujourd'hui")
 * shrinks the session to fit rather than leaving it overshooting the time
 * the athlete actually has — a distinct, purely time-driven rule from the
 * fatigue/RPE path above (brief §22: exceptions recompute intelligently,
 * they don't just get ignored).
 */
export function decideAvailabilityConstraint(
  session: PlannedSession,
  availableMinutes: number,
): AdaptationDecision {
  const before: AdaptationSnapshot = { estimatedDurationMin: session.estimatedDurationMin }

  if (availableMinutes >= session.estimatedDurationMin) {
    return decision(
      session,
      'KEEP',
      ['NO_SIGNAL'],
      before,
      before,
      "Séance inchangée : le temps disponible aujourd'hui suffit.",
    )
  }

  const afterMinutes = Math.max(MIN_SESSION_MINUTES, Math.round(availableMinutes))
  return decision(
    session,
    'REDUCE',
    ['REDUCED_AVAILABILITY_TODAY'],
    before,
    { estimatedDurationMin: afterMinutes },
    `Séance réduite de ${before.estimatedDurationMin} à ${afterMinutes} min pour tenir dans le temps que tu as aujourd'hui.`,
  )
}
