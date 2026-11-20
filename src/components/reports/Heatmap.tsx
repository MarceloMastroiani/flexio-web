import type { HeatmapBusiestSlot } from '../../types'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function Heatmap({
  matrix,
  busiestSlot,
}: {
  matrix: number[][]
  busiestSlot: HeatmapBusiestSlot | null
}) {
  if (matrix.length === 0) {
    return <p className="py-10 text-center text-xs text-gray-500">Sin datos en el período</p>
  }

  const max = Math.max(1, ...matrix.flat())
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div
            className="mb-1 grid text-[9px] text-gray-500"
            style={{ gridTemplateColumns: '40px repeat(24, minmax(0, 1fr))' }}
          >
            <span />
            {hours.map((h) => (
              <span key={h} className="text-center">
                {h % 3 === 0 ? h : ''}
              </span>
            ))}
          </div>
          {matrix.map((row, dayIndex) => (
            <div
              key={dayIndex}
              className="mb-0.5 grid items-center"
              style={{ gridTemplateColumns: '40px repeat(24, minmax(0, 1fr))' }}
            >
              <span className="text-[10px] text-gray-500">{DAYS[dayIndex]}</span>
              {row.map((count, hour) => (
                <div
                  key={hour}
                  title={`${DAYS[dayIndex] ?? ''} ${hour}:00 — ${count} turno(s)`}
                  className="m-px h-4 rounded-sm"
                  style={{
                    backgroundColor:
                      count === 0
                        ? 'rgba(255,255,255,0.04)'
                        : `rgba(145,71,255,${0.15 + 0.85 * (count / max)})`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {busiestSlot && (
        <p className="mt-2 text-xs text-gray-500">
          Horario con más turnos: {DAYS[busiestSlot.weekday - 1] ?? ''} {busiestSlot.hour}:00 (
          {busiestSlot.count})
        </p>
      )}
    </div>
  )
}
