import { Outlet } from 'react-router-dom'

/** Same width constraint as RootLayout, without the bottom nav — for
 * full-focus flows (onboarding, session player, feedback forms) that
 * would otherwise stretch edge-to-edge on tablet/desktop viewports. */
export function FocusedLayout() {
  return (
    <div className="mx-auto min-h-full max-w-md bg-background text-text">
      <Outlet />
    </div>
  )
}
