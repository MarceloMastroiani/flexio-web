import { useState } from 'react'
import { api } from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Card, EmptyState, PageHeader } from '../components/ui/Feedback'
import { formatDateInputValue, todayISO } from '../lib/format'

function startOfMonth(): string {
  const now = new Date()
  return formatDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

export default function Reports() {
  const { toast } = useToast()
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ raw: unknown; isString: boolean } | null>(null)

  async function run() {
    setLoading(true)
    try {
      const res = await api.get<unknown>(`/reports/revenue?from=${from}&to=${to}`, false)
      setResult({ raw: res, isString: typeof res === 'string' })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al consultar el reporte', 'error')
    } finally {
      setLoading(false)
    }
  }

  const isEmptyStub = result?.isString

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Ingresos y estadísticas" />

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Desde" required>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Hasta" required>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button onClick={run} loading={loading}>Generar reporte</Button>
        </div>
      </Card>

      {result && (
        <Card className="p-5">
          {isEmptyStub ? (
            <EmptyState
              icon="🔧"
              title="Reporte en construcción"
              subtitle="El endpoint de ingresos todavía no está implementado en la API (devuelve vacío). Pronto estará disponible."
            />
          ) : (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Ingresos del período</h3>
              <pre className="overflow-x-auto rounded-lg bg-surface-0 p-4 text-xs text-gray-400">
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      )}

      {!result && (
        <EmptyState
          icon="📊"
          title="Seleccioná un período"
          subtitle="Elegí las fechas y generá el reporte de ingresos."
        />
      )}
    </div>
  )
}
