import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from '../components/ui/Toast'
import type { Service } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Card, ConfirmDialog, EmptyState, PageHeader, Spinner } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { formatMoney } from '../lib/format'

const emptyForm = { name: '', price: '' }

export default function Services() {
  const { toast } = useToast()
  const services = useData(() => api.get<Service[]>('/services', false))
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setForm(emptyForm)
    setCreating(true)
  }
  function openEdit(s: Service) {
    setForm({ name: s.name, price: String(s.price) })
    setEditing(s)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
    }
    try {
      if (editing) {
        await api.patch(`/services/${editing.id}`, payload)
        toast('Servicio actualizado')
      } else {
        await api.post('/services', payload)
        toast('Servicio creado')
      }
      setCreating(false)
      setEditing(null)
      services.reload()
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
      await api.del(`/services/${deleteTarget.id}`)
      toast('Servicio eliminado')
      setDeleteTarget(null)
      services.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Servicios"
        subtitle="Catálogo de servicios y precios"
        actions={<Button onClick={openCreate}>+ Nuevo servicio</Button>}
      />

      {services.loading ? (
        <Spinner label="Cargando servicios…" />
      ) : services.error ? (
        <EmptyState title="No se pudieron cargar los servicios" subtitle={services.error} />
      ) : (services.data ?? []).length === 0 ? (
        <EmptyState icon="✂️" title="Sin servicios" subtitle="Cargá los servicios que ofrece la peluquería." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(services.data ?? []).map((s) => (
            <Card key={s.id} className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-950/60 text-lg">✂️</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                <p className="text-xs text-gray-500">Servicio</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-brand-300">{formatMoney(s.price)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-surface-2 hover:text-white"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleteTarget(s)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-rose-950/50 hover:text-rose-400"
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null) }}
        title={editing ? 'Editar servicio' : 'Nuevo servicio'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreating(false); setEditing(null) }}>Cancelar</Button>
            <Button onClick={save} loading={saving} disabled={!form.name || !form.price}>Guardar</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Nombre" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Corte de pelo" required />
          </Field>
          <Field label="Precio ($)" required>
            <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Eliminar servicio"
        message={`¿Eliminar "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
