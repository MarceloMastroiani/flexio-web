import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

const NAV = [
  { to: '/', label: 'Inicio', icon: '🏠', end: true },
  { to: '/appointments', label: 'Turnos', icon: '📅', admin: false },
  { to: '/services', label: 'Servicios', icon: '✂️', admin: false },
  { to: '/customers', label: 'Clientes', icon: '👥', admin: false },
  { to: '/employees', label: 'Empleados', icon: '💇', admin: false },
  { to: '/cash', label: 'Caja', icon: '💰', admin: true },
  { to: '/users', label: 'Usuarios', icon: '🔐', admin: true },
  { to: '/reports', label: 'Reportes', icon: '📊', admin: false },
]

export function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  const items = NAV.filter((n) => !n.admin || isAdmin)

  return (
    <div className="flex h-full min-h-screen">
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-surface-3 bg-surface-1 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-surface-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg shadow-lg shadow-brand-900/50">
            💇
          </div>
          <div>
            <p className="text-sm font-bold text-white">Flexio</p>
            <p className="text-[11px] text-gray-500">Gestión de peluquería</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-950/70 text-brand-300'
                    : 'text-gray-400 hover:bg-surface-2 hover:text-white'
                }`
              }
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-3 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-brand-300">
              {(user?.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.email}</p>
              <p className="text-[11px] text-gray-500">{user?.role === 'ADMIN' ? 'Administrador' : 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg border border-surface-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-surface-2 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-surface-3 bg-surface-0/80 px-4 backdrop-blur lg:px-8">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:bg-surface-2 lg:hidden"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
          <h2 className="text-sm font-medium text-gray-400">
            {items.find((n) => n.end ? location.pathname === '/' : location.pathname.startsWith(n.to))?.label ?? 'Flexio'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-brand-800/60 bg-brand-950/50 px-3 py-1 text-[11px] font-medium text-brand-300">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Staff'}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
