import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from '../components/ui/Toast'
import type { Role, User } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Card, EmptyState, PageHeader, Spinner } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { ROLE_LABEL, formatDateShort } from '../lib/format'

export default function Users() {
  const { toast } = useToast()
  const users = useData(() => api.get<User[]>('/auth'))
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('STAFF')
  const [saving, setSaving] = useState(false)

  async function create(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/auth', { email: email.trim(), password, role })
      toast('Usuario creado')
      setCreating(false)
      setEmail('')
      setPassword('')
      setRole('STAFF')
      users.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al crear el usuario', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Cuentas de acceso al sistema"
        actions={<Button onClick={() => setCreating(true)}>+ Nuevo usuario</Button>}
      />

      {users.loading ? (
        <Spinner label="Cargando usuarios…" />
      ) : users.error ? (
        <EmptyState title="No se pudieron cargar los usuarios" subtitle={users.error} />
      ) : (users.data ?? []).length === 0 ? (
        <EmptyState icon="🔐" title="Sin usuarios" />
      ) : (
        <div className="space-y-2">
          {(users.data ?? []).map((u) => (
            <Card key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-brand-300">
                {u.email[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{u.email}</p>
                <p className="text-xs text-gray-500">Creado el {formatDateShort(u.createdAt)}</p>
              </div>
              <Badge tone={u.role === 'ADMIN' ? 'violet' : 'gray'}>{ROLE_LABEL[u.role]}</Badge>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo usuario"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={create} loading={saving} disabled={!email || !password}>Crear</Button>
          </>
        }
      >
        <form onSubmit={create} className="space-y-4">
          <Field label="Email" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@mail.com" required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contraseña" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </Field>
            <Field label="Rol" required>
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Administrador</option>
              </Select>
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  )
}
