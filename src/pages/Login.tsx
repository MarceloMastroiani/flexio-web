import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { ApiError } from '../lib/api'

export default function Login() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/admin" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-700/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-brand-900/20 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-lg shadow-brand-900/50">
            💇
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Flexio</h1>
            <p className="mt-1 text-sm text-gray-500">Gestión de tu peluquería</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-surface-3 bg-surface-1/90 p-6 shadow-2xl backdrop-blur"
        >
          <h2 className="mb-5 text-sm font-semibold text-gray-300">Iniciar sesión</h2>
          <div className="space-y-4">
            <Field label="Email" required>
              <Input
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Contraseña" required>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/50 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}
            <Button type="submit" loading={submitting} className="w-full">
              Ingresar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
