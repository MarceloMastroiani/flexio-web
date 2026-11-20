import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/ui/Toast'
import type { Appointment, AppointmentStatus, AvailableSlot, Customer, Employee, PagedAppointments, Service } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Badge, statusTone } from '../components/ui/Badge'
import { Card, ConfirmDialog, EmptyState, PageHeader, Spinner } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { formatDateShort, formatMoney, formatTime, todayISO, STATUS_LABEL } from '../lib/format'

const STATUS_FILTERS: { value: AppointmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Completados' },
  { value: 'CANCELLED', label: 'Cancelados' },
]

export default function Appointments() {
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [assignTarget, setAssignTarget] = useState<Appointment | null>(null)
  const [extendTarget, setExtendTarget] = useState<Appointment | null>(null)

  // Filtros
  const [showAll, setShowAll] = useState(false)
  const [dateFilter, setDateFilter] = useState(todayISO())
  const [status, setStatus] = useState<AppointmentStatus | 'ALL'>('ALL')
  const [employeeId, setEmployeeId] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  const employees = useData(() => api.get<Employee[]>('/employees'))
  const services = useData(() => api.get<Service[]>('/services', false))

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (!showAll && dateFilter) {
      params.set('from', dateFilter)
      params.set('to', dateFilter)
    }
    if (status !== 'ALL') params.set('status', status)
    if (employeeId) params.set('employeeId', employeeId)
    if (serviceFilter === 'none') params.set('withoutService', 'true')
    else if (serviceFilter) params.set('serviceId', serviceFilter)
    if (debouncedQ) params.set('q', debouncedQ)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    params.set('order', showAll ? 'desc' : 'asc')
    return params.toString()
  }, [showAll, dateFilter, status, employeeId, serviceFilter, debouncedQ, page, pageSize])

  const appointments = useData(
    () => api.get<PagedAppointments>(`/appointments?${query}`),
    [query],
  )

  const items = appointments.data?.items ?? []
  const total = appointments.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function removeAppointment() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/appointments/${deleteTarget.id}`)
      toast('Turno eliminado')
      setDeleteTarget(null)
      appointments.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function updateStatus(a: Appointment, status: AppointmentStatus) {
    try {
      await api.patch(`/appointments/${a.id}`, { status })
      toast(`Turno marcado como ${STATUS_LABEL[status].toLowerCase()}`)
      appointments.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al actualizar', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Turnos"
        subtitle="Administrá los turnos de la peluquería"
        actions={<Button onClick={() => setCreateOpen(true)}>+ Nuevo turno</Button>}
      />

      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg border border-surface-3 bg-surface-1 p-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setStatus(s.value)
                  setPage(1)
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === s.value ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-surface-3 bg-surface-1 p-1">
            <button
              onClick={() => {
                setShowAll(false)
                setDateFilter(todayISO())
                setPage(1)
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !showAll ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => {
                setShowAll(true)
                setPage(1)
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                showAll ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos los días
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Input
            type="date"
            value={showAll ? '' : dateFilter}
            disabled={showAll}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setShowAll(false)
              setPage(1)
            }}
            className="w-44"
          />
          <Select
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value)
              setPage(1)
            }}
            className="w-48"
          >
            <option value="">Todos los empleados</option>
            {(employees.data ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
          <Select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value)
              setPage(1)
            }}
            className="w-48"
          >
            <option value="">Todos los servicios</option>
            <option value="none">Sin servicio</option>
            {(services.data ?? []).map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Buscar cliente (nombre o teléfono)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStatus('ALL')
              setEmployeeId('')
              setServiceFilter('')
              setQ('')
              setShowAll(false)
              setDateFilter(todayISO())
              setPage(1)
              setPageSize(20)
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {total} turno{total === 1 ? '' : 's'}
          {showAll ? ' (todos los días)' : ` del ${dateFilter}`}
        </span>
        {appointments.loading && <span>Actualizando…</span>}
      </div>

      {appointments.loading && !appointments.data ? (
        <Spinner label="Cargando turnos…" />
      ) : appointments.error ? (
        <EmptyState title="No se pudieron cargar los turnos" subtitle={appointments.error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📅"
          title={showAll ? 'No hay turnos con estos filtros' : 'No hay turnos hoy'}
          subtitle={showAll ? 'Probá cambiar los filtros.' : 'Mirá los turnos de todos los días.'}
          action={
            !showAll ? (
              <Button
                size="sm"
                onClick={() => {
                  setShowAll(true)
                  setPage(1)
                }}
              >
                Ver todos los días
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                + Nuevo turno
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {items.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex w-24 flex-col">
                  <span className="text-sm font-semibold text-white">{formatTime(a.startsAt)}</span>
                  <span className="text-[11px] text-gray-500">
                    {formatDateShort(a.startsAt)} · {durationLabel(a)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">{a.customer.name}</p>
                    <Badge tone={statusTone[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {a.employee.name}
                    {a.service ? ` · ${a.service.name}` : ' · Sin servicio'}
                    {a.notes ? ` · ${a.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAssignTarget(a)}
                    className="h-8 rounded-lg border border-surface-3 px-2.5 text-xs font-medium text-gray-300 transition-colors hover:bg-surface-2 hover:text-white"
                    title="Asignar servicio"
                  >
                    ✂️ Servicio
                  </button>
                  <button
                    onClick={() => setExtendTarget(a)}
                    className="h-8 rounded-lg border border-surface-3 px-2.5 text-xs font-medium text-gray-300 transition-colors hover:bg-surface-2 hover:text-white"
                    title="Extender turno"
                  >
                    ⏱ Extender
                  </button>
                  <Select
                    value={a.status}
                    onChange={(e) => void updateStatus(a, e.target.value as AppointmentStatus)}
                    className="h-8 w-36 text-xs"
                  >
                    {(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as AppointmentStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </Select>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-rose-950/50 hover:text-rose-400"
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Por página</span>
              <Select
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="h-8 w-20 text-xs"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}

      {createOpen && (
        <CreateAppointmentModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); appointments.reload() }}
        />
      )}
      {assignTarget && (
        <AssignServiceModal
          appointment={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSaved={() => { setAssignTarget(null); appointments.reload() }}
        />
      )}
      {extendTarget && (
        <ExtendModal
          appointment={extendTarget}
          onClose={() => setExtendTarget(null)}
          onSaved={() => { setExtendTarget(null); appointments.reload() }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeAppointment}
        loading={deleting}
        title="Eliminar turno"
        message={`¿Eliminar el turno de ${deleteTarget?.customer.name}? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}

function durationLabel(a: Appointment): string {
  const minutes = Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000)
  return `${minutes} min`
}

function CreateAppointmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const customers = useData(() => api.get<Customer[]>('/customers'))
  const employees = useData(() => api.get<Employee[]>('/employees'))

  const [customerId, setCustomerId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const forbidden = customers.error || employees.error
  const selectedEmployee = employees.data?.find((e) => e.id === employeeId)

  function pickEmployee(id: string) {
    setEmployeeId(id)
    const emp = employees.data?.find((e) => e.id === id)
    setDuration(emp ? String(emp.slotMinutes) : '')
    setSlots(null)
    setSelectedSlot(null)
  }

  async function fetchSlots() {
    if (!customerId) return toast('Elegí el cliente', 'info')
    if (!employeeId) return toast('Elegí el empleado', 'info')
    if (!duration || Number(duration) < 5) return toast('Ingresá una duración válida', 'info')
    setLoadingSlots(true)
    setSlots(null)
    setSelectedSlot(null)
    try {
      const res = await api.get<AvailableSlot[]>(
        `/appointments/available?employeeId=${employeeId}&date=${date}`,
        false,
      )
      setSlots(res)
      if (res.length === 0) toast('No hay horarios disponibles para esta fecha', 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al consultar disponibilidad', 'error')
    } finally {
      setLoadingSlots(false)
    }
  }

  async function submit() {
    if (selectedSlot === null || !slots) return toast('Elegí un horario', 'info')
    setSubmitting(true)
    try {
      await api.post('/appointments', {
        customerId,
        employeeId,
        startsAt: slots[selectedSlot].start,
        durationMinutes: Number(duration),
        notes: notes.trim() || undefined,
      })
      toast('Turno creado')
      onCreated()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al crear el turno', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formReady = Boolean(customerId && employeeId && duration)

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo turno"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!formReady || selectedSlot === null || submitting} loading={submitting}>
            Guardar turno
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente" required>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={!isAdmin || Boolean(forbidden)}>
            <option value="">Seleccionar cliente…</option>
            {(customers.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Empleado" required>
          <Select value={employeeId} onChange={(e) => pickEmployee(e.target.value)} disabled={!isAdmin || Boolean(forbidden)}>
            <option value="">Seleccionar empleado…</option>
            {(employees.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      {forbidden && (
        <div className="mt-3 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
          Necesitás permisos de administrador para elegir cliente/empleado.
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field label="Fecha" required>
          <Input type="date" value={date} min={todayISO()} onChange={(e) => { setDate(e.target.value); setSlots(null); setSelectedSlot(null) }} />
        </Field>
        <Field label="Duración (min)" required hint={selectedEmployee ? `Por defecto del empleado: ${selectedEmployee.slotMinutes} min` : undefined}>
          <Input type="number" min={5} max={480} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" className="w-28" />
        </Field>
        <Field label="Notas">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </Field>
        <Button variant="outline" onClick={fetchSlots} disabled={!formReady || loadingSlots} loading={loadingSlots}>
          Ver disponibilidad
        </Button>
      </div>

      {slots && slots.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-gray-400">Horarios disponibles:</p>
          <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {slots.map((s, i) => (
              <button
                key={s.start}
                type="button"
                onClick={() => setSelectedSlot(i)}
                className={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${
                  selectedSlot === i ? 'border-brand-500 bg-brand-600 text-white' : 'border-surface-3 bg-surface-0/50 text-gray-300 hover:bg-surface-2'
                }`}
              >
                {formatTime(s.start)}
              </button>
            ))}
          </div>
          {selectedSlot !== null && slots[selectedSlot] && (
            <p className="mt-2 text-xs text-gray-500">
              Turno de {formatTime(slots[selectedSlot].start)} a {formatTime(slots[selectedSlot].end)}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

function AssignServiceModal({ appointment, onClose, onSaved }: { appointment: Appointment; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const services = useData(() => api.get<Service[]>('/services', false))
  const [serviceId, setServiceId] = useState(appointment.serviceId ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await api.patch(`/appointments/${appointment.id}`, { serviceId: serviceId || null })
      toast(serviceId ? 'Servicio asignado' : 'Servicio quitado')
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al asignar el servicio', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Asignar servicio"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>Guardar</Button>
        </>
      }
    >
      <p className="mb-3 text-xs text-gray-500">
        Turno de {appointment.customer.name} · {formatTime(appointment.startsAt)}
      </p>
      <Field label="Servicio" hint="Se usa para métricas e información. Podés dejarlo sin asignar.">
        <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          <option value="">Sin servicio</option>
          {(services.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {formatMoney(s.price)}</option>
          ))}
        </Select>
      </Field>
    </Modal>
  )
}

function ExtendModal({ appointment, onClose, onSaved }: { appointment: Appointment; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const [target, setTarget] = useState<AvailableSlot | null>(null)
  const [saving, setSaving] = useState(false)

  const date = useMemo(() => appointment.startsAt.slice(0, 10), [appointment.startsAt])

  // Bloques libres que empiezan después del fin del turno actual
  const slots = useData<AvailableSlot[]>(
    async () => {
      const res = await api.get<AvailableSlot[]>(
        `/appointments/available?employeeId=${appointment.employeeId}&date=${date}`,
        false,
      )
      return res.filter((s) => new Date(s.start) >= new Date(appointment.endsAt))
    },
    [appointment.employeeId, appointment.endsAt, date],
  )

  async function save() {
    if (!target) return
    const minutes = Math.round((new Date(target.end).getTime() - new Date(appointment.startsAt).getTime()) / 60000)
    setSaving(true)
    try {
      await api.patch(`/appointments/${appointment.id}`, { durationMinutes: minutes })
      toast(`Turno extendido a ${formatTime(target.end)}`)
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo extender el turno', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Extender turno"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={!target || saving} loading={saving}>Extender</Button>
        </>
      }
    >
      <p className="mb-3 text-xs text-gray-500">
        Turno de {appointment.customer.name}: {formatTime(appointment.startsAt)} a {formatTime(appointment.endsAt)} ({durationLabel(appointment)}).
        Elegí hasta qué horario extenderlo.
      </p>
      {slots.loading ? (
        <Spinner label="Buscando horarios libres…" />
      ) : slots.error ? (
        <EmptyState icon="⚠️" title="No se pudo consultar" subtitle={slots.error} />
      ) : (slots.data ?? []).length === 0 ? (
        <EmptyState icon="🔒" title="No hay bloques libres" subtitle="Los horarios siguientes ya están ocupados." />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(slots.data ?? []).map((s) => (
            <button
              key={s.start}
              type="button"
              onClick={() => setTarget(s)}
              className={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${
                target?.start === s.start ? 'border-brand-500 bg-brand-600 text-white' : 'border-surface-3 bg-surface-0/50 text-gray-300 hover:bg-surface-2'
              }`}
            >
              {formatTime(s.start)}–{formatTime(s.end)}
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
