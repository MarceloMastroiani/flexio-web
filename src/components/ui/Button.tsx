import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  loading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-500 focus-visible:ring-brand-400/50 shadow-md shadow-brand-900/40',
  secondary:
    'bg-surface-2 text-gray-100 hover:bg-surface-3 focus-visible:ring-gray-500/40 border border-surface-3',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400/50 shadow-md shadow-rose-900/40',
  ghost: 'bg-transparent text-gray-300 hover:bg-surface-2 hover:text-white focus-visible:ring-gray-500/40',
  outline:
    'bg-transparent text-brand-300 border border-brand-700 hover:bg-brand-950/50 focus-visible:ring-brand-400/50',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
