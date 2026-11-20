import type { Delta, SummaryMetric } from '../../types'
import { Card } from '../ui/Feedback'

export function StatCard({
  label,
  value,
  delta,
  icon,
  hint,
}: {
  label: string
  value: string
  delta?: Delta | null
  icon?: string
  hint?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {icon && <span className="text-base">{icon}</span>}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {delta &&
        (delta.changePct === null ? (
          <p className="mt-1 text-[11px] text-gray-500">Sin período previo comparable</p>
        ) : (
          <p
            className={`mt-1 text-[11px] font-medium ${
              delta.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
            title={`Anterior: ${delta.previous}`}
          >
            {delta.changePct >= 0 ? '▲' : '▼'} {Math.abs(delta.changePct).toFixed(1)}%{' '}
            <span className="text-gray-500">vs período anterior</span>
          </p>
        ))}
      {hint && <p className="mt-1 text-[11px] text-gray-500">{hint}</p>}
    </Card>
  )
}

export function MetricCard({
  label,
  metric,
  format,
  icon,
}: {
  label: string
  metric: SummaryMetric | null
  format: (n: number) => string
  icon?: string
}) {
  if (metric === null) return <StatCard label={label} value="—" icon={icon} />
  if (typeof metric === 'number') {
    return <StatCard label={label} value={format(metric)} icon={icon} />
  }
  return <StatCard label={label} value={format(metric.value)} delta={metric} icon={icon} />
}
