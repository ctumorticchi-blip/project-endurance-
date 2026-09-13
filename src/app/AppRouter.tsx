import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { CssTestPage } from '@/features/calibration/CssTestPage'
import { FtpTestPage } from '@/features/calibration/FtpTestPage'
import { ThresholdPaceTestPage } from '@/features/calibration/ThresholdPaceTestPage'
import { CompletedFeedbackPage } from '@/features/feedback/CompletedFeedbackPage'
import { MissedSessionPage } from '@/features/feedback/MissedSessionPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { PlanPage } from '@/features/plan/PlanPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { SessionPlayerPage } from '@/features/session-player/SessionPlayerPage'
import { TodayPage } from '@/features/today/TodayPage'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { RedirectIfOnboarded, RequireOnboarding } from './OnboardingGate'
import { RootLayout } from './RootLayout'

const router = createBrowserRouter([
  {
    element: <RedirectIfOnboarded />,
    children: [{ path: 'onboarding', element: <OnboardingPage /> }],
  },
  {
    element: <RequireOnboarding />,
    children: [
      { path: 'session/:sessionId', element: <SessionPlayerPage /> },
      { path: 'session/:sessionId/feedback', element: <CompletedFeedbackPage /> },
      { path: 'session/:sessionId/missed', element: <MissedSessionPage /> },
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <Navigate to="/today" replace /> },
          { path: 'today', element: <TodayPage /> },
          { path: 'plan', element: <PlanPage /> },
          {
            path: 'progress',
            element: (
              <PlaceholderPage
                title="Progrès"
                description="La page de progression arrive en M0.11."
              />
            ),
          },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/tests/ftp', element: <FtpTestPage /> },
          { path: 'profile/tests/css', element: <CssTestPage /> },
          { path: 'profile/tests/threshold', element: <ThresholdPaceTestPage /> },
          {
            path: '*',
            element: (
              <PlaceholderPage title="Introuvable" description="Cette page n’existe pas." />
            ),
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
