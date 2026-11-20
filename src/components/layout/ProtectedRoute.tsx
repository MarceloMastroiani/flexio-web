import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { Spinner } from '../ui/Feedback'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Cargando sesión…" />
  if (!user) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <Spinner label="Cargando sesión…" />
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/admin" replace />
  return <>{children}</>
}
