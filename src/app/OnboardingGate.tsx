import { Navigate, Outlet } from 'react-router-dom'
import { isOnboardingComplete } from '@/core/onboardingStatus'

/** Guards the main app shell: no profile yet → send the athlete through onboarding first. */
export function RequireOnboarding() {
  return isOnboardingComplete() ? <Outlet /> : <Navigate to="/onboarding" replace />
}

/** Guards onboarding itself: already onboarded → don't re-run the wizard. */
export function RedirectIfOnboarded() {
  return isOnboardingComplete() ? <Navigate to="/today" replace /> : <Outlet />
}
