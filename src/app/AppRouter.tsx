import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { PlanPage } from '@/features/plan/PlanPage'
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
      {
        path: 'session/:sessionId/feedback',
        element: (
          <PlaceholderPage
            title="Ressenti"
            description="Le formulaire de feedback post-séance arrive en M0.7."
          />
        ),
      },
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
          {
            path: 'profile',
            element: (
              <PlaceholderPage
                title="Profil"
                description="Le détail du profil athlète arrive avec le moteur de calibration (M0.10)."
              />
            ),
          },
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
