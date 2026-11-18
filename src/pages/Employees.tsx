import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from '../components/ui/Toast'
import type { DayAvailability, Employee, User } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Card, ConfirmDialog, EmptyState, PageHeader, Spinner } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'

const DAYS: { key: keyof DayAvailability; label: string }[] = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]

type TimeRange = { start: string; end: string }
type AvailForm = Record<string, TimeRange[]>

function emptyAvail(): AvailForm {
  const a: AvailForm = {}
  for (const d of DAYS) a[d.key] = []
  return a
}

function toForm(availability: DayAvailability | null | undefined): AvailForm {
  const a = emptyAvail()
  if (!availability) return a
  for (const d of DAYS) {
    a[d.key] = availability[d.key]?.map((r) => ({ ...r })) ?? []
  }
  return a
}

function toDto(form: AvailForm): DayAvailability {
  const out: DayAvailability = {}
  for (const d of DAYS) {
    const ranges = form[d.key].filter((r) => r.start && r.end)
    if (ranges.length > 0) out[d.key] = ranges
  }
  return out
}

export default function Employees() {
  const { toast } = useToast()
  const employees = useData(() => api.get<Employee[]>('/employees'))
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [avail, setAvail] = useState<AvailForm>(emptyAvail())
  const [slotMinutes, setSlotMinutes] = useState('30')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setName('')
    setUserId('')
    setAvail(emptyAvail())
    setSlotMinutes('30')
    setCreating(true)
  }
  function openEdit(e: Employee) {
    setName(e.name)
    setUserId(e.userId ?? '')
    setAvail(toForm(e.availability))
    setSlotMinutes(String(e.slotMinutes ?? 30))
    setEditing(e)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/employees/${editing.id}`, { name: name.trim(), availability: toDto(avail), slotMinutes: Number(slotMinutes) })
        toast('Empleado actualizado')
      } else {
        if (!userId) return toast('Seleccioná el usuario vinculado', 'info')
        await api.post(`/employees/${userId}`, { name: name.trim(), availability: toDto(avail), slotMinutes: Number(slotMinutes) })
        toast('Empleado creado')
      }
      setCreating(false)
      setEditing(null)
      employees.reload()
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
      await api.del(`/employees/${deleteTarget.id}`)
      toast('Empleado eliminado')
      setDeleteTarget(null)
      employees.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Empleados"
        subtitle="Equipo y disponibilidad semanal"
        actions={<Button onClick={openCreate}>+ Nuevo empleado</Button>}
      />

      {employees.loading ? (
        <Spinner label="Cargando empleados…" />
      ) : employees.error ? (
        <EmptyState title="No se pudieron cargar los empleados" subtitle={employees.error} />
      ) : (employees.data ?? []).length === 0 ? (
        <EmptyState icon="💇" title="Sin empleados" subtitle="Sumá al equipo de la peluquería." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(employees.data ?? []).map((e) => {
            const totalRanges = Object.values(e.availability ?? {}).reduce((acc, r) => acc + (r?.length ?? 0), 0)
            return (
              <Card key={e.id} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-950/60 text-sm font-semibold text-brand-300">
                  {e.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{e.name}</p>
                  <p className="text-xs text-gray-500">
                    Turnos de {e.slotMinutes ?? 30} min ·{' '}
                    {totalRanges > 0 ? `${totalRanges} franjas semanales` : 'Sin disponibilidad'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(e)} className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-surface-2 hover:text-white" title="Editar">
                    ✏️
                  </button>
                  <button onClick={() => setDeleteTarget(e)} className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-rose-950/50 hover:text-rose-400" title="Eliminar">
                    🗑
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <EmployeeModal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null) }}
        isEditing={!!editing}
        name={name}
        setName={setName}
        userId={userId}
        setUserId={setUserId}
        slotMinutes={slotMinutes}
        setSlotMinutes={setSlotMinutes}
        avail={avail}
        setAvail={setAvail}
        onSave={save}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Eliminar empleado"
        message={`¿Eliminar a "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

function EmployeeModal({
  open,
  onClose,
  isEditing,
  name,
  setName,
  userId,
  setUserId,
  slotMinutes,
  setSlotMinutes,
  avail,
  setAvail,
  onSave,
  saving,
}: {
  open: boolean
  onClose: () => void
  isEditing: boolean
  name: string
  setName: (v: string) => void
  userId: string
  setUserId: (v: string) => void
  slotMinutes: string
  setSlotMinutes: (v: string) => void
  avail: AvailForm
  setAvail: (v: AvailForm) => void
  onSave: (e: FormEvent) => void
  saving: boolean
}) {
  const users = useData(() => api.get<User[]>('/auth'))
  const showUserPicker = !isEditing

  function addRange(day: keyof DayAvailability) {
    setAvail({ ...avail, [day]: [...(avail[day] ?? []), { start: '09:00', end: '18:00' }] })
  }
  function setRange(day: keyof DayAvailability, i: number, field: 'start' | 'end', value: string) {
    const next = (avail[day] ?? []).map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    setAvail({ ...avail, [day]: next })
  }
  function removeRange(day: keyof DayAvailability, i: number) {
    setAvail({ ...avail, [day]: (avail[day] ?? []).filter((_, idx) => idx !== i) })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar empleado' : 'Nuevo empleado'}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} loading={saving} disabled={!name.trim()}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del empleado" required />
          </Field>
          {showUserPicker ? (
            <Field label="Usuario vinculado" required hint="El email se toma del usuario.">
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Seleccionar usuario…</option>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Duración del turno (min)" required hint="Cuánto dura cada turno por defecto.">
              <Input type="number" min={5} max={480} step={5} value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} required />
            </Field>
          )}
        </div>

        {showUserPicker && (
          <Field label="Duración del turno (min)" required hint="Cuánto dura cada turno por defecto.">
            <Input type="number" min={5} max={480} step={5} value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} required />
          </Field>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-gray-400">Disponibilidad semanal</p>
          <div className="space-y-2">
            {DAYS.map((d) => (
              <div key={d.key} className="rounded-lg border border-surface-3 bg-surface-0/50 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-300">{d.label}</span>
                  <button
                    type="button"
                    onClick={() => addRange(d.key)}
                    className="rounded px-2 py-1 text-[11px] font-medium text-brand-300 hover:bg-brand-950/50"
                  >
                    + Horario
                  </button>
                </div>
                {avail[d.key].length === 0 && <p className="mt-1 text-[11px] text-gray-600">No trabaja</p>}
                <div className="mt-1.5 space-y-1.5">
                  {avail[d.key].map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={r.start}
                        onChange={(e) => setRange(d.key, i, 'start', e.target.value)}
                        className="h-8 w-28 rounded-lg border border-surface-3 bg-surface-1 px-2 text-xs text-gray-200 outline-none focus:border-brand-500"
                      />
                      <span className="text-xs text-gray-500">a</span>
                      <input
                        type="time"
                        value={r.end}
                        onChange={(e) => setRange(d.key, i, 'end', e.target.value)}
                        className="h-8 w-28 rounded-lg border border-surface-3 bg-surface-1 px-2 text-xs text-gray-200 outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeRange(d.key, i)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-500 hover:bg-rose-950/50 hover:text-rose-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
