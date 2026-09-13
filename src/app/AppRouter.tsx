import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { RootLayout } from './RootLayout'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      {
        path: 'today',
        element: (
          <PlaceholderPage
            title="Aujourd’hui"
            description="L’écran central arrive en M0.5 : séance du jour, objectif, structure et pourquoi."
          />
        ),
      },
      {
        path: 'plan',
        element: (
          <PlaceholderPage
            title="Programme"
            description="Le générateur de plan arrive en M0.4."
          />
        ),
      },
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
            description="L’onboarding et le profil athlète arrivent en M0.1."
          />
        ),
      },
      {
        path: '*',
        element: <PlaceholderPage title="Introuvable" description="Cette page n’existe pas." />,
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
