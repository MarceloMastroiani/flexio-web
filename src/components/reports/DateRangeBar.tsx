import type { Granularity } from '../../types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Feedback'
import { Field, Input, Select } from '../ui/Input'

export function DateRangeBar({
  from,
  to,
  granularity,
  onFrom,
  onTo,
  onGranularity,
  onApply,
  loading,
  showGranularity = true,
}: {
  from: string
  to: string
  granularity: Granularity
  onFrom: (v: string) => void
  onTo: (v: string) => void
  onGranularity: (v: Granularity) => void
  onApply: () => void
  loading: boolean
  showGranularity?: boolean
}) {
  return (
    <Card className="mb-5 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Desde">
          <Input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
        </Field>
        <Field label="Hasta">
          <Input type="date" value={to} onChange={(e) => onTo(e.target.value)} />
        </Field>
        {showGranularity && (
          <Field label="Granularidad">
            <Select
              value={granularity}
              onChange={(e) => onGranularity(e.target.value as Granularity)}
              className="w-36"
            >
              <option value="day">Diaria</option>
              <option value="week">Semanal</option>
              <option value="month">Mensual</option>
            </Select>
          </Field>
        )}
        <Button onClick={onApply} loading={loading}>
          Aplicar
        </Button>
      </div>
    </Card>
  )
}
