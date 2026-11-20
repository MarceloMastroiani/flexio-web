import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useData } from '../lib/useData'
import { useAuth } from '../lib/auth'
import type { Appointment, Payment } from '../types'
import { Badge, statusTone } from '../components/ui/Badge'
import { Card, EmptyState } from '../components/ui/Feedback'
import { formatMoney, formatTime, greeting, isSameDay, toMoneyNumber, todayISO, formatDateLong } from '../lib/format'
import { STATUS_LABEL } from '../lib/format'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-surface-3 bg-surface-1" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-surface-3 bg-surface-1" />
    </div>
  )
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const appointments = useData(() => api.get<Appointment[]>('/appointments'))
  const todayPayments = useData<Payment[]>(
    () => api.get(`/cash/payments/day?date=${todayISO()}`),
    [],
  )

  const todayAppointments = useMemo(() => {
    if (!appointments.data) return []
    return appointments.data
      .filter((a) => isSameDay(a.startsAt))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  }, [appointments.data])

  const pending = useMemo(() => todayAppointments.filter((a) => a.status === 'PENDING').length, [todayAppointments])
  const dayTotal = useMemo(
    () => (todayPayments.data ?? []).reduce((acc, p) => acc + toMoneyNumber(p.amount), 0),
    [todayPayments.data],
  )

  if (appointments.loading || todayPayments.loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">
          {greeting()}, {user?.email?.split('@')[0] ?? ''}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">{formatDateLong(new Date().toISOString())}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="📅"
          label="Turnos hoy"
          value={String(todayAppointments.length)}
          tone="border-brand-800/60 bg-brand-950/30"
        />
        <StatCard icon="⏳" label="Pendientes" value={String(pending)} tone="border-amber-800/60 bg-amber-950/30" />
        {isAdmin && (
          <StatCard icon="💵" label="Cobrado hoy" value={formatMoney(dayTotal)} tone="border-emerald-800/60 bg-emerald-950/30" />
        )}
        <StatCard icon="✅" label="Completados" value={String(todayAppointments.filter((a) => a.status === 'COMPLETED').length)} tone="border-emerald-800/60 bg-emerald-950/30" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Turnos de hoy</h2>
          <Link to="/admin/turnos" className="text-xs font-medium text-brand-400 hover:text-brand-300">
            Ver todos →
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <EmptyState
            icon="🌤️"
            title="Sin turnos para hoy"
            subtitle="Cuando se registren turnos para esta fecha, aparecerán acá."
            action={
              <Link
                to="/admin/turnos"
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-500"
              >
                Nuevo turno
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {todayAppointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-3 bg-surface-0/50 px-4 py-3"
              >
                <span className="w-20 text-sm font-semibold text-brand-300">{formatTime(a.startsAt)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{a.customer.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {a.employee.name} · {a.service?.name ?? 'Sin servicio'}
                  </p>
                </div>
                <Badge tone={statusTone[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="text-base">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
