import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from '../components/ui/Toast'
import type { AvailableSlot, Service } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Card } from '../components/ui/Feedback'
import { formatDateLong, formatMoney, formatTime, greeting, todayISO } from '../lib/format'

interface PublicEmployee {
  id: string
  name: string
}

export default function Booking() {
  const { toast } = useToast()
  const employees = useData(() => api.get<PublicEmployee[]>('/public/employees', false))
  const services = useData(() => api.get<Service[]>('/services', false))

  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ time: string; employee: string } | null>(null)

  async function fetchSlots() {
    if (!employeeId) return toast('Elegí el profesional', 'info')
    setLoadingSlots(true)
    setSlots(null)
    setSelectedSlot(null)
    try {
      const res = await api.get<AvailableSlot[]>(
        `/appointments/available?employeeId=${employeeId}&date=${date}`,
        false,
      )
      setSlots(res)
      if (res.length === 0) toast('No hay horarios libres para esa fecha', 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al consultar horarios', 'error')
    } finally {
      setLoadingSlots(false)
    }
  }

  async function confirm() {
    if (selectedSlot === null || !slots) return
    if (!name.trim()) return toast('Ingresá tu nombre', 'info')
    if (!phone.trim()) return toast('Ingresá tu teléfono', 'info')
    setSubmitting(true)
    try {
      const slot = slots[selectedSlot]
      await api.post(
        '/public/appointments',
        {
          name: name.trim(),
          phone: phone.trim(),
          employeeId,
          startsAt: slot.start,
        },
        false,
      )
      setDone({
        time: formatTime(slot.start),
        employee: employees.data?.find((e) => e.id === employeeId)?.name ?? '',
      })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo reservar el turno', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setDone(null)
    setEmployeeId('')
    setSlots(null)
    setSelectedSlot(null)
    setName('')
    setPhone('')
  }

  if (done) {
    return (
      <BookingShell>
        <Card className="mx-auto max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60 text-3xl">✅</div>
          <h2 className="text-lg font-bold text-white">¡Turno reservado!</h2>
          <p className="mt-2 text-sm text-gray-400">
            Te esperamos el <span className="font-semibold text-white">{formatDateLong(date)}</span> a las{' '}
            <span className="font-semibold text-brand-300">{done.time}</span>
          </p>
          {done.employee && <p className="mt-1 text-xs text-gray-500">Con {done.employee}</p>}
          <Button onClick={reset} variant="secondary" className="mt-6">
            Hacer otra reserva
          </Button>
        </Card>
      </BookingShell>
    )
  }

  const selectedEmployee = employees.data?.find((e) => e.id === employeeId)
  const formReady = Boolean(employeeId)

  return (
    <BookingShell>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-lg shadow-brand-900/50">
          💇
        </div>
        <h2 className="text-2xl font-bold text-white">Reservá tu turno</h2>
        <p className="mt-1 text-sm text-gray-500">{greeting()}! Elegí el profesional y el horario.</p>
      </div>

      <Card className="mx-auto max-w-2xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Profesional" required>
            <Select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setSlots(null); setSelectedSlot(null) }}>
              <option value="">Seleccionar…</option>
              {(employees.data ?? []).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha" required>
            <Input type="date" value={date} min={todayISO()} onChange={(e) => { setDate(e.target.value); setSlots(null); setSelectedSlot(null) }} />
          </Field>
        </div>

        <div className="mt-4">
          <Button onClick={fetchSlots} disabled={!formReady || loadingSlots} loading={loadingSlots} className="w-full">
            Ver horarios disponibles
          </Button>
        </div>

        {slots && slots.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-white">Elegí el horario</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
          </div>
        )}

        {selectedSlot !== null && slots && slots[selectedSlot] && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tu nombre" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
              </Field>
              <Field label="Teléfono" required>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
              </Field>
            </div>
            <Button onClick={confirm} loading={submitting} className="w-full">
              Confirmar reserva · {formatTime(slots[selectedSlot].start)} {selectedEmployee ? `· ${selectedEmployee.name}` : ''}
            </Button>
          </div>
        )}
      </Card>

      {services.data && services.data.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl">
          <p className="mb-3 text-center text-xs uppercase tracking-wide text-gray-500">Nuestros servicios</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(services.data ?? []).map((s) => (
              <span key={s.id} className="rounded-full border border-surface-3 bg-surface-1 px-3 py-1.5 text-xs text-gray-300">
                {s.name} · {formatMoney(s.price)}
              </span>
            ))}
          </div>
        </div>
      )}
    </BookingShell>
  )
}

function BookingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-0 px-4 py-10">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-brand-700/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-900/25 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm">💇</span>
            <span className="text-sm font-bold text-white">Flexio</span>
          </div>
          <Link to="/login" className="text-xs font-medium text-gray-400 hover:text-white">
            Acceso del personal →
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
