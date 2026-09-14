import type { OnboardingDraft, OnboardingStepId } from './onboardingState'

/** Per-step gate for the "Continue" button. Steps with no required fields
 * (equipment, metrics, review) are always valid. */
export function isStepValid(step: OnboardingStepId, draft: OnboardingDraft): boolean {
  switch (step) {
    case 'race-goal':
      return Boolean(draft.distance && draft.raceDate)
    case 'experience':
      if (!draft.generalSportExperience) return false
      return draft.sport === 'triathlon'
        ? Boolean(draft.triathlonExperience && draft.swimLevel && draft.bikeLevel && draft.runLevel)
        : Boolean(draft.runningExperience && draft.runLevel)
    case 'equipment':
      return true
    case 'metrics':
      return true
    case 'availability':
      return (
        Object.values(draft.weeklyPattern).some((d) => d.available && d.minutes > 0) &&
        draft.restDays.length > 0
      )
    case 'review':
      return true
  }
}
