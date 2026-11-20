import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { cancelAppointment, lookupAppointments } from '../lib/publicBooking'
import { useToast } from '../components/ui/Toast'
import type { PublicAppointmentItem } from '../types'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Badge, statusTone } from '../components/ui/Badge'
import { Card, ConfirmDialog, EmptyState, Spinner } from '../components/ui/Feedback'
import { STATUS_LABEL, formatDateLong, formatTime } from '../lib/format'

export default function ManageBooking() {
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [items, setItems] = useState<PublicAppointmentItem[]>([])
  const [cancelTarget, setCancelTarget] = useState<PublicAppointmentItem | null>(null)
  const [cancelling, setCancelling] = useState(false)

  async function search(e?: FormEvent) {
    e?.preventDefault()
    if (!phone.trim()) {
      toast('Ingresá tu teléfono', 'info')
      return
    }
    setLoading(true)
    try {
      const res = await lookupAppointments(phone.trim())
      setItems(res.items)
      setSearched(true)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudieron buscar los turnos', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function doCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointment(cancelTarget.id, phone.trim())
      toast('Turno cancelado')
      setCancelTarget(null)
      await search()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo cancelar el turno', 'error')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-surface-0 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm">
              💇
            </span>
            Flexio
          </Link>
          <Link to="/" className="text-xs font-medium text-gray-400 hover:text-white">
            ← Reservar un turno
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Gestioná tu turno</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresá el teléfono con el que reservaste para ver y cancelar tus turnos.
          </p>
        </div>

        <Card className="p-6">
          <form
            onSubmit={(e) => void search(e)}
            className="flex flex-wrap items-end gap-3"
          >
            <Field label="Teléfono" required>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
              />
            </Field>
            <Button type="submit" loading={loading}>
              Buscar turnos
            </Button>
          </form>
        </Card>

        <div className="mt-6">
          {loading ? (
            <Spinner label="Buscando…" />
          ) : !searched ? null : items.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No encontramos turnos"
              subtitle="No hay turnos próximos para ese teléfono."
            />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {formatDateLong(item.startsAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(item.startsAt)} · {item.employeeName}
                    </p>
                  </div>
                  <Badge tone={statusTone[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                  {item.cancellable ? (
                    <Button variant="danger" size="sm" onClick={() => setCancelTarget(item)}>
                      Cancelar
                    </Button>
                  ) : (
                    <span className="text-[11px] text-amber-400">
                      No cancelable (muy cerca del horario)
                    </span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void doCancel()}
        loading={cancelling}
        title="Cancelar turno"
        message="¿Seguro que querés cancelar este turno?"
        confirmLabel="Sí, cancelar"
      />
    </div>
  )
}
