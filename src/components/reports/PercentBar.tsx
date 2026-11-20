export function PercentBar({
  value,
  color = 'bg-brand-500',
}: {
  value: number | null
  color?: string
}) {
  if (value === null) return <span className="text-xs text-gray-500">—</span>
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400">{value.toFixed(1)}%</span>
    </div>
  )
}
