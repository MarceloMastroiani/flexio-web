import { useId } from 'react'

export interface ChartPoint {
  label: string
  value: number
}

export function SeriesChart({
  points,
  height = 180,
  color = '#9147ff',
  formatValue,
}: {
  points: ChartPoint[]
  height?: number
  color?: string
  formatValue?: (n: number) => string
}) {
  const gradientId = useId()

  if (points.length === 0) {
    return <p className="py-10 text-center text-xs text-gray-500">Sin datos en el período</p>
  }

  const max = Math.max(...points.map((p) => p.value), 1)
  const n = points.length
  const coords = points.map((p, i) => ({
    x: n === 1 ? 50 : (i / (n - 1)) * 100,
    y: 100 - (p.value / max) * 88 - 4,
    ...p,
  }))
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const area = `0,100 ${polyline} 100,100`

  return (
    <div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {n === 1 && <circle cx={50} cy={coords[0]!.y} r={1.5} fill={color} />}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
        <span>{points[0]?.label}</span>
        <span>máx {formatValue ? formatValue(max) : max}</span>
        <span>{points[n - 1]?.label}</span>
      </div>
    </div>
  )
}
