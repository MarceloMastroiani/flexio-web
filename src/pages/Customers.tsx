import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from '../components/ui/Toast'
import type { Customer } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Card, ConfirmDialog, EmptyState, PageHeader, Spinner } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { formatDateShort, initials } from '../lib/format'

const emptyForm = { name: '', phone: '', email: '' }

export default function Customers() {
  const { toast } = useToast()
  const customers = useData(() => api.get<Customer[]>('/customers'))
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = (customers.data ?? []).filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query) ||
      c.email?.toLowerCase().includes(query.toLowerCase()),
  )

  function openCreate() {
    setForm(emptyForm)
    setCreating(true)
  }
  function openEdit(c: Customer) {
    setForm({ name: c.name, phone: c.phone ?? '', email: c.email ?? '' })
    setEditing(c)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    }
    try {
      if (editing) {
        await api.patch(`/customers/${editing.id}`, payload)
        toast('Cliente actualizado')
      } else {
        await api.post('/customers', payload)
        toast('Cliente creado')
      }
      setCreating(false)
      setEditing(null)
      customers.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/customers/${deleteTarget.id}`)
      toast('Cliente eliminado')
      setDeleteTarget(null)
      customers.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Directorio de clientes de la peluquería"
        actions={<Button onClick={openCreate}>+ Nuevo cliente</Button>}
      />

      <div className="mb-4">
        <Input placeholder="Buscar por nombre, teléfono o email…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
      </div>

      {customers.loading ? (
        <Spinner label="Cargando clientes…" />
      ) : customers.error ? (
        <EmptyState title="No se pudieron cargar los clientes" subtitle={customers.error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="👥" title="Sin clientes" subtitle="Registrá tu primer cliente para empezar." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-950/60 text-sm font-semibold text-brand-300">
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {c.phone ?? c.email ?? 'Sin contacto'}
                  {c.lastVisitAt && ` · Últ. ${formatDateShort(c.lastVisitAt)}`}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-surface-2 hover:text-white" title="Editar">
                  ✏️
                </button>
                <button onClick={() => setDeleteTarget(c)} className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-rose-950/50 hover:text-rose-400" title="Eliminar">
                  🗑
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null) }}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreating(false); setEditing(null) }}>Cancelar</Button>
            <Button onClick={save} loading={saving} disabled={!form.name || !form.phone || !form.email}>Guardar</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Nombre" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido" required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono" required>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+54 11 1234-5678" required />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@mail.com" required />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Eliminar cliente"
        message={`¿Eliminar a "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
