import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { id, label, error, hint, type = 'text', ...props }, ref,
) {
  const [visible, setVisible] = useState(false)
  const password = type === 'password'
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">{label}</label>
      <div className="relative">
        <input {...props} ref={ref} id={id} type={password && visible ? 'text' : type}
          aria-invalid={error ? true : undefined} aria-describedby={describedBy}
          className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 ${password ? 'pr-12' : ''} ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {password && (
          <button type="button" onClick={() => setVisible(!visible)}
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible}
            className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-gray-500 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-sm text-red-600">{error}</p>}
    </div>
  )
})
