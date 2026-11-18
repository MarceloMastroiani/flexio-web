import type { ReactNode } from 'react'

type Tone = 'gray' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky'

const tones: Record<Tone, string> = {
  gray: 'bg-surface-3 text-gray-300 border-surface-3',
  violet: 'bg-brand-950/60 text-brand-300 border-brand-800/60',
  emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  amber: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
  rose: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
  sky: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export const statusTone: Record<string, Tone> = {
  PENDING: 'amber',
  CONFIRMED: 'sky',
  COMPLETED: 'emerald',
  CANCELLED: 'rose',
}

export const methodTone: Record<string, Tone> = {
  CASH: 'emerald',
  TRANSFER: 'sky',
  CARD: 'violet',
  MERCADOPAGO: 'sky',
}
