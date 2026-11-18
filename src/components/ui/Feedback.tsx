import type { ReactNode } from 'react'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function EmptyState({ icon = '🗒️', title, subtitle, action }: { icon?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-surface-3 py-14 text-center">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      {subtitle && <p className="max-w-sm text-xs text-gray-500">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-surface-3 bg-surface-1 ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Eliminar',
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-surface-3 bg-surface-1 p-5 shadow-2xl">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-950/60 text-rose-400">
          ⚠
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-surface-3 px-4 text-sm text-gray-300 transition-colors hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
          >
            {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
