import { NavLink, Outlet } from 'react-router-dom'
import { brand } from '@/config/brand'

const NAV_ITEMS = [
  { to: '/today', label: 'Aujourd’hui' },
  { to: '/plan', label: 'Programme' },
  { to: '/progress', label: 'Progrès' },
  { to: '/profile', label: 'Profil' },
] as const

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-background text-text">
      <header className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold tracking-wide text-text-muted">{brand.name}</p>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-border bg-surface"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-xs font-medium ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
