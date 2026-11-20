import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/ui/Toast'
import {
  appointmentsCsvPath,
  downloadCsv,
  reportsApi,
  revenueCsvPath,
} from '../lib/reports'
import type {
  AppointmentsData,
  CustomersData,
  EmployeesData,
  Granularity,
  HeatmapData,
  InactiveCustomersData,
  ReportMeta,
  RevenueData,
  ServicesData,
  SummaryData,
} from '../types'
import { Button } from '../components/ui/Button'
import { Card, EmptyState, PageHeader, Spinner } from '../components/ui/Feedback'
import { Select } from '../components/ui/Input'
import { StatCard, MetricCard } from '../components/reports/StatCard'
import { DateRangeBar } from '../components/reports/DateRangeBar'
import { SeriesChart } from '../components/reports/SeriesChart'
import { PercentBar } from '../components/reports/PercentBar'
import { Heatmap } from '../components/reports/Heatmap'
import { SimpleTable } from '../components/reports/SimpleTable'
import {
  METHOD_LABEL,
  STATUS_LABEL,
  formatDateInputValue,
  formatDateShort,
  formatMoney,
  formatPct,
  todayISO,
} from '../lib/format'

type Tab = 'summary' | 'revenue' | 'appointments' | 'services' | 'employees' | 'customers'

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Resumen' },
  { id: 'revenue', label: 'Ingresos' },
  { id: 'appointments', label: 'Turnos' },
  { id: 'services', label: 'Servicios' },
  { id: 'employees', label: 'Empleados' },
  { id: 'customers', label: 'Clientes' },
]

const int = (n: number) => new Intl.NumberFormat('es-AR').format(n)

function startOfMonth(): string {
  const now = new Date()
  return formatDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

export default function Reports() {
  const { token } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<Tab>('summary')
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(todayISO())
  const [applied, setApplied] = useState({ from: startOfMonth(), to: todayISO() })
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [compare, setCompare] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<ReportMeta | null>(null)

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [appointments, setAppointments] = useState<AppointmentsData | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [services, setServices] = useState<ServicesData | null>(null)
  const [employees, setEmployees] = useState<EmployeesData | null>(null)
  const [customers, setCustomers] = useState<CustomersData | null>(null)
  const [inactive, setInactive] = useState<InactiveCustomersData | null>(null)

  const [inactiveDays, setInactiveDays] = useState(60)
  const [inactivePage, setInactivePage] = useState(1)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      try {
        if (tab === 'summary') {
          const res = await reportsApi.summary({
            from: applied.from,
            to: applied.to,
            compare,
          })
          if (cancelled) return
          setSummary(res.data)
          setMeta(res.meta)
        } else if (tab === 'revenue') {
          const res = await reportsApi.revenue({
            from: applied.from,
            to: applied.to,
            granularity,
          })
          if (cancelled) return
          setRevenue(res.data)
          setMeta(res.meta)
        } else if (tab === 'appointments') {
          const [a, h] = await Promise.all([
            reportsApi.appointments({ from: applied.from, to: applied.to, granularity }),
            reportsApi.heatmap({ from: applied.from, to: applied.to }),
          ])
          if (cancelled) return
          setAppointments(a.data)
          setHeatmap(h.data)
          setMeta(a.meta)
        } else if (tab === 'services') {
          const res = await reportsApi.servicesTop({
            from: applied.from,
            to: applied.to,
            limit: 10,
            orderBy: 'count',
          })
          if (cancelled) return
          setServices(res.data)
          setMeta(res.meta)
        } else if (tab === 'employees') {
          const res = await reportsApi.employees({ from: applied.from, to: applied.to })
          if (cancelled) return
          setEmployees(res.data)
          setMeta(res.meta)
        } else {
          const [c, i] = await Promise.all([
            reportsApi.customers({ from: applied.from, to: applied.to, limit: 10 }),
            reportsApi.customersInactive({ days: inactiveDays, page: inactivePage, pageSize: 20 }),
          ])
          if (cancelled) return
          setCustomers(c.data)
          setInactive(i.data)
          setMeta(c.meta)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al generar el reporte')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [tab, granularity, applied.from, applied.to, compare, inactiveDays, inactivePage])

  function apply() {
    setApplied({ from, to })
    setInactivePage(1)
  }

  async function exportCsv(kind: 'revenue' | 'appointments') {
    const path =
      kind === 'revenue'
        ? revenueCsvPath({ from: applied.from, to: applied.to, granularity })
        : appointmentsCsvPath({ from: applied.from, to: applied.to, granularity })
    try {
      await downloadCsv(path, `${kind}_${applied.from}_${applied.to}.csv`, token)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo descargar el CSV', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle={
          meta
            ? `${meta.from} → ${meta.to} · ${meta.timezone}`
            : 'Ingresos, turnos y estadísticas del negocio'
        }
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-surface-3 bg-surface-1 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DateRangeBar
        from={from}
        to={to}
        granularity={granularity}
        onFrom={setFrom}
        onTo={setTo}
        onGranularity={setGranularity}
        onApply={apply}
        loading={loading}
        showGranularity={tab === 'revenue' || tab === 'appointments'}
      />

      {error && (
        <Card className="mb-4 border-rose-800/60 bg-rose-950/30 p-4 text-sm text-rose-300">
          {error}
        </Card>
      )}

      {loading ? (
        <Spinner label="Generando reporte…" />
      ) : (
        <div>
          {tab === 'summary' && (
            <SummaryTab
              data={summary}
              compare={compare}
              onCompare={setCompare}
              comparison={meta?.comparison ?? null}
            />
          )}
          {tab === 'revenue' && (
            <RevenueTab data={revenue} onExport={() => void exportCsv('revenue')} />
          )}
          {tab === 'appointments' && (
            <AppointmentsTab
              data={appointments}
              heatmap={heatmap}
              onExport={() => void exportCsv('appointments')}
            />
          )}
          {tab === 'services' && <ServicesTab data={services} />}
          {tab === 'employees' && <EmployeesTab data={employees} />}
          {tab === 'customers' && (
            <CustomersTab
              data={customers}
              inactive={inactive}
              days={inactiveDays}
              page={inactivePage}
              onChangeDays={(d) => {
                setInactiveDays(d)
                setInactivePage(1)
              }}
              onChangePage={setInactivePage}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function SummaryTab({
  data,
  compare,
  onCompare,
  comparison,
}: {
  data: SummaryData | null
  compare: boolean
  onCompare: (v: boolean) => void
  comparison: { from: string; to: string } | null
}) {
  if (!data) return <EmptyState icon="📊" title="Sin datos" subtitle="Aplicá un rango para ver el resumen." />
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => onCompare(e.target.checked)}
            className="h-4 w-4 rounded border-surface-3 bg-surface-1"
          />
          Comparar con período anterior
        </label>
        {comparison && (
          <span className="text-[11px] text-gray-500">
            vs {comparison.from} → {comparison.to}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Ingresos" metric={data.revenue} format={formatMoney} icon="💵" />
        <MetricCard label="Cobros" metric={data.paymentsCount} format={int} icon="🧾" />
        <MetricCard label="Ticket promedio" metric={data.averageTicket} format={formatMoney} icon="🎟️" />
        <MetricCard label="Turnos" metric={data.appointmentsTotal} format={int} icon="📅" />
        <MetricCard label="Tasa de completado" metric={data.completionRatePct} format={formatPct} icon="✅" />
        <MetricCard label="Tasa de cancelación" metric={data.cancellationRatePct} format={formatPct} icon="🚫" />
        <MetricCard label="Clientes nuevos" metric={data.newCustomers} format={int} icon="👥" />
        <MetricCard label="Ocupación" metric={data.occupancyPct} format={formatPct} icon="⏱️" />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="text-base">✂️</span> Servicio más pedido
        </div>
        <p className="mt-2 text-2xl font-bold text-white">
          {data.topService ? data.topService.name : '—'}
        </p>
        {data.topService && (
          <p className="mt-1 text-[11px] text-gray-500">{data.topService.count} turnos completados</p>
        )}
      </Card>
    </div>
  )
}

function RevenueTab({ data, onExport }: { data: RevenueData | null; onExport: () => void }) {
  if (!data) return <EmptyState icon="💵" title="Sin datos" subtitle="Aplicá un rango para ver ingresos." />
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ingresos" value={formatMoney(data.total)} icon="💵" />
        <StatCard label="Cobros" value={int(data.paymentsCount)} icon="🧾" />
        <StatCard label="Ticket promedio" value={formatMoney(data.averageTicket)} icon="🎟️" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Evolución de ingresos</h3>
          <SeriesChart
            points={data.series.map((p) => ({ label: p.date, value: p.total }))}
            formatValue={formatMoney}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Por método de pago</h3>
          <SimpleTable
            columns={[
              { key: 'method', label: 'Método', render: (r) => METHOD_LABEL[r.method] ?? r.method },
              { key: 'total', label: 'Total', align: 'right', render: (r) => formatMoney(r.total) },
              { key: 'count', label: 'Cobros', align: 'right', render: (r) => int(r.count) },
              {
                key: 'sharePct',
                label: 'Participación',
                align: 'right',
                render: (r) => <PercentBar value={r.sharePct} />,
              },
            ]}
            rows={data.byMethod}
          />
        </Card>
      </div>

      <Button variant="secondary" onClick={onExport}>
        ⬇ Descargar CSV
      </Button>
    </div>
  )
}

function AppointmentsTab({
  data,
  heatmap,
  onExport,
}: {
  data: AppointmentsData | null
  heatmap: HeatmapData | null
  onExport: () => void
}) {
  if (!data) return <EmptyState icon="📅" title="Sin datos" subtitle="Aplicá un rango para ver turnos." />
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Turnos" value={int(data.total)} icon="📅" />
        <StatCard label="Completado" value={formatPct(data.completionRatePct)} icon="✅" />
        <StatCard label="Cancelación" value={formatPct(data.cancellationRatePct)} icon="🚫" />
        <StatCard label="Extendidos" value={int(data.extendedCount)} icon="⏱️" />
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Por estado</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
            <div key={s} className="rounded-lg border border-surface-3 bg-surface-0/50 p-3">
              <p className="text-[11px] text-gray-500">{STATUS_LABEL[s]}</p>
              <p className="mt-1 text-xl font-bold text-white">{int(data.byStatus[s])}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Evolución de turnos</h3>
        <SeriesChart
          points={data.series.map((p) => ({ label: p.date, value: p.total }))}
          color="#38bdf8"
          formatValue={int}
        />
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Mapa de calor (día × hora)</h3>
        {heatmap ? <Heatmap matrix={heatmap.matrix} busiestSlot={heatmap.busiestSlot} /> : null}
      </Card>

      <Button variant="secondary" onClick={onExport}>
        ⬇ Descargar CSV
      </Button>
    </div>
  )
}

function ServicesTab({ data }: { data: ServicesData | null }) {
  if (!data) return <EmptyState icon="✂️" title="Sin datos" subtitle="Aplicá un rango para ver servicios." />
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Turnos completados" value={int(data.completedAppointments)} icon="✅" />
        <StatCard label="Con servicio" value={int(data.appointmentsWithServices)} icon="✂️" />
        <StatCard label="Sin servicio" value={int(data.appointmentsWithoutServices)} icon="❓" />
        <StatCard label="Cobertura" value={formatPct(data.coveragePct)} icon="📈" />
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Top servicios</h3>
        <SimpleTable
          columns={[
            { key: 'name', label: 'Servicio' },
            { key: 'count', label: 'Turnos', align: 'right', render: (r) => int(r.count) },
            { key: 'revenue', label: 'Ingresos', align: 'right', render: (r) => formatMoney(r.revenue) },
            {
              key: 'sharePct',
              label: 'Participación',
              align: 'right',
              render: (r) => <PercentBar value={r.sharePct} />,
            },
          ]}
          rows={data.services}
          empty="Sin turnos con servicio en el período"
        />
      </Card>
    </div>
  )
}

function EmployeesTab({ data }: { data: EmployeesData | null }) {
  if (!data) return <EmptyState icon="💇" title="Sin datos" subtitle="Aplicá un rango para ver empleados." />
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Ocupación general" value={formatPct(data.occupancyPct)} icon="⏱️" />
        <StatCard label="Empleados" value={int(data.employees.length)} icon="💇" />
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Rendimiento por empleado</h3>
        <SimpleTable
          columns={[
            { key: 'name', label: 'Empleado' },
            { key: 'total', label: 'Turnos', align: 'right', render: (r) => int(r.appointments.total) },
            { key: 'completed', label: 'Completados', align: 'right', render: (r) => int(r.appointments.completed) },
            { key: 'cancelled', label: 'Cancelados', align: 'right', render: (r) => int(r.appointments.cancelled) },
            { key: 'revenue', label: 'Ingresos', align: 'right', render: (r) => formatMoney(r.revenue) },
            {
              key: 'extended',
              label: 'Extendidos',
              align: 'right',
              render: (r) => `${int(r.extendedAppointments)} (${int(r.extendedSlotsTotal)} slots)`,
            },
            {
              key: 'occupancyPct',
              label: 'Ocupación',
              align: 'right',
              render: (r) => <PercentBar value={r.occupancyPct} color="bg-emerald-500" />,
            },
          ]}
          rows={data.employees}
        />
      </Card>
    </div>
  )
}

function CustomersTab({
  data,
  inactive,
  days,
  page,
  onChangeDays,
  onChangePage,
}: {
  data: CustomersData | null
  inactive: InactiveCustomersData | null
  days: number
  page: number
  onChangeDays: (d: number) => void
  onChangePage: (p: number) => void
}) {
  const hasNext = inactive ? page * inactive.pageSize < inactive.total : false
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Clientes activos" value={data ? int(data.activeCustomers) : '—'} icon="👥" />
        <StatCard label="Nuevos" value={data ? int(data.newCustomers) : '—'} icon="🌱" />
        <StatCard label="Recurrentes" value={data ? int(data.returningCustomers) : '—'} icon="🔁" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Top por gasto</h3>
          <SimpleTable
            columns={[
              { key: 'name', label: 'Cliente' },
              { key: 'visits', label: 'Visitas', align: 'right', render: (r) => int(r.visits) },
              { key: 'totalSpent', label: 'Gastado', align: 'right', render: (r) => formatMoney(r.totalSpent) },
            ]}
            rows={data?.topBySpend ?? []}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Top por visitas</h3>
          <SimpleTable
            columns={[
              { key: 'name', label: 'Cliente' },
              { key: 'visits', label: 'Visitas', align: 'right', render: (r) => int(r.visits) },
              { key: 'totalSpent', label: 'Gastado', align: 'right', render: (r) => formatMoney(r.totalSpent) },
            ]}
            rows={data?.topByVisits ?? []}
          />
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Clientes inactivos</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">Sin turno hace</span>
            <Select
              value={String(days)}
              onChange={(e) => onChangeDays(Number(e.target.value))}
              className="h-8 w-32 text-xs"
            >
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
              <option value="180">180 días</option>
            </Select>
          </div>
        </div>

        <SimpleTable
          columns={[
            { key: 'name', label: 'Cliente' },
            { key: 'phone', label: 'Teléfono', render: (r) => r.phone ?? '—' },
            { key: 'email', label: 'Email', render: (r) => r.email ?? '—' },
            {
              key: 'lastVisitAt',
              label: 'Última visita',
              render: (r) => (r.lastVisitAt ? formatDateShort(r.lastVisitAt) : 'Nunca'),
            },
          ]}
          rows={inactive?.items ?? []}
          empty="No hay clientes inactivos en este período"
        />

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{inactive ? `${inactive.total} inactivos` : ''}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => onChangePage(Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasNext}
              onClick={() => onChangePage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
