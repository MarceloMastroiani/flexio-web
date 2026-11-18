import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const baseField =
  'w-full rounded-lg border border-surface-3 bg-surface-1 px-3 text-sm text-gray-100 placeholder:text-gray-500 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => (
    <input ref={ref} className={`${baseField} h-10 ${className}`} {...rest} />
  ),
)
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...rest }, ref) => (
    <select ref={ref} className={`${baseField} h-10 appearance-none pr-8 ${className}`} {...rest}>
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...rest }, ref) => (
    <textarea ref={ref} className={`${baseField} min-h-24 py-2.5 ${className}`} {...rest} />
  ),
)
Textarea.displayName = 'Textarea'

export function Field({ label, children, hint, required }: { label: string; children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-400">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-gray-500">{hint}</span>}
    </label>
  )
}
