import type { ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  render?: (row: T) => ReactNode
}

function alignClass(align?: 'left' | 'right' | 'center'): string {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

export function SimpleTable<T>({
  columns,
  rows,
  empty,
}: {
  columns: TableColumn<T>[]
  rows: T[]
  empty?: string
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-xs text-gray-500">{empty ?? 'Sin datos'}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-[11px] uppercase tracking-wide text-gray-500">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2 font-medium ${alignClass(column.align)}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-surface-3/60 last:border-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3 py-2 text-gray-300 ${alignClass(column.align)}`}
                >
                  {column.render
                    ? column.render(row)
                    : String(
                        (row as Record<string, unknown>)[column.key] ?? '—',
                      )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
