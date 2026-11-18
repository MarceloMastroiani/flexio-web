import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAccessToken, setOnUnauthorized } from './api'
import type { AuthUser } from '../types'

const TOKEN_KEY = 'flexio_token'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parsePayload(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)
    if (!payload || typeof payload.sub !== 'string') return null
    return { userId: payload.sub, email: payload.email ?? '', role: payload.role ?? 'STAFF' }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    return t ? parsePayload(t) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAccessToken(token)
  }, [token])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setOnUnauthorized(logout)
    return () => setOnUnauthorized(null)
  }, [logout])

  useEffect(() => {
    async function refreshProfile() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const profile = await api.get<AuthUser>('/auth/profile')
        setUser({ ...profile, userId: profile.userId })
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    void refreshProfile()
  }, [token, logout])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/auth/login', { email, password }, false)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setAccessToken(res.access_token)
    setToken(res.access_token)
    const profile = await api.get<AuthUser>('/auth/profile')
    setUser({ ...profile, userId: profile.userId })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, token, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
