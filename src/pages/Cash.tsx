import { useMemo, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from '../components/ui/Toast'
import type { Appointment, Payment, PaymentMethod } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Badge, methodTone } from '../components/ui/Badge'
import { Card, ConfirmDialog, EmptyState, PageHeader, Spinner } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { formatMoney, formatTime, todayISO, toMoneyNumber, METHOD_LABEL, STATUS_LABEL } from '../lib/format'

export default function Cash() {
  const { toast } = useToast()
  const [date, setDate] = useState(todayISO())
  const [registerOpen, setRegisterOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const payments = useData<Payment[]>(
    () => api.get<Payment[]>(`/cash/payments/day?date=${date}`).catch(() => [] as Payment[]),
    [date],
  )
  const close = useData<Payment[]>(
    () => api.get<Payment[]>(`/cash/payments/cash-close?date=${date}`).catch(() => [] as Payment[]),
    [date],
  )

  const total = useMemo(() => (payments.data ?? []).reduce((acc, p) => acc + toMoneyNumber(p.amount), 0), [payments.data])
  const byMethod = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of payments.data ?? []) map[p.method] = (map[p.method] ?? 0) + toMoneyNumber(p.amount)
    return map
  }, [payments.data])

  async function remove() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/cash/${deleteTarget.id}`)
      toast('Pago eliminado')
      setDeleteTarget(null)
      payments.reload()
      close.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Caja"
        subtitle="Pagos y cierre de caja del día"
        actions={
          <Button onClick={() => setRegisterOpen(true)}>+ Registrar pago</Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        <Card className="flex items-center gap-3 px-4 py-2.5">
          <span className="text-xs text-gray-400">Total del día</span>
          <span className="text-lg font-bold text-emerald-300">{formatMoney(total)}</span>
        </Card>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
          <Card key={m} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{METHOD_LABEL[m]}</span>
              <Badge tone={methodTone[m]}>{formatMoney(byMethod[m] ?? 0)}</Badge>
            </div>
            <p className="mt-1 text-xl font-bold text-white">{byMethod[m] ? formatMoney(byMethod[m]) : '—'}</p>
          </Card>
        ))}
      </div>

      {payments.loading || close.loading ? (
        <Spinner label="Cargando pagos…" />
      ) : (payments.data ?? []).length === 0 ? (
        <EmptyState icon="💰" title="Sin pagos registrados" subtitle="No hay pagos para esta fecha." action={<Button size="sm" onClick={() => setRegisterOpen(true)}>+ Registrar pago</Button>} />
      ) : (
        <div className="space-y-2">
          {(payments.data ?? []).map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex w-20 flex-col">
                <span className="text-sm font-semibold text-white">{formatTime(p.paidAt)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {p.appointment?.customer?.name ?? 'Turno'}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {p.appointment ? (p.appointment.service?.name ?? 'Sin servicio') : ''}
                  {p.notes ? ` · ${p.notes}` : ''}
                </p>
              </div>
              <Badge tone={methodTone[p.method]}>{METHOD_LABEL[p.method]}</Badge>
              <span className="text-sm font-bold text-emerald-300">{formatMoney(p.amount)}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(p)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-surface-2 hover:text-white"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-gray-400 hover:bg-rose-950/50 hover:text-rose-400"
                >
                  🗑
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {registerOpen && (
        <PaymentModal
          onClose={() => setRegisterOpen(false)}
          onSaved={() => { setRegisterOpen(false); payments.reload(); close.reload() }}
        />
      )}
      {editing && (
        <EditPaymentModal
          payment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); payments.reload(); close.reload() }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Eliminar pago"
        message={`¿Eliminar este pago de ${formatMoney(deleteTarget?.amount)}?`}
      />
    </div>
  )
}

function PaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const appointments = useData(() => api.get<Appointment[]>('/appointments', false))
  const [appointmentId, setAppointmentId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const candidates = useMemo(
    () => (appointments.data ?? []).filter((a) => a.status !== 'CANCELLED').sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()),
    [appointments.data],
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!appointmentId) return toast('Seleccioná el turno', 'info')
    setSaving(true)
    try {
      await api.post(`/cash/${appointmentId}`, {
        amount: Number(amount),
        method,
        notes: notes.trim() || undefined,
      })
      toast('Pago registrado')
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al registrar el pago', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar pago"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!appointmentId || !amount}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Turno" required>
          <Select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)}>
            <option value="">Seleccionar turno…</option>
            {candidates.map((a) => (
              <option key={a.id} value={a.id}>
                {formatTime(a.startsAt)} · {a.customer.name} · {a.service?.name ?? 'Sin servicio'} · {STATUS_LABEL[a.status]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monto ($)" required>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
          </Field>
          <Field label="Método" required>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>{METHOD_LABEL[m]}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notas">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </Field>
      </form>
    </Modal>
  )
}

function EditPaymentModal({ payment, onClose, onSaved }: { payment: Payment; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const [amount, setAmount] = useState(String(toMoneyNumber(payment.amount)))
  const [method, setMethod] = useState<PaymentMethod>(payment.method)
  const [notes, setNotes] = useState(payment.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/cash/${payment.id}`, {
        amount: Number(amount),
        method,
        notes: notes.trim() || undefined,
      })
      toast('Pago actualizado')
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al actualizar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar pago"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!amount}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monto ($)" required>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label="Método" required>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>{METHOD_LABEL[m]}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notas">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
