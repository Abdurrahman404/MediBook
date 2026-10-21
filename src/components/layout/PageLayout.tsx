import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  className?: string
  actions?: ReactNode
}

/** Consistent page wrapper: max-width container, heading, optional action slot. */
export function PageLayout({
  children,
  title,
  subtitle,
  className,
  actions,
}: PageLayoutProps) {
  return (
    <main className={cn('page-container animate-fade-in', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </main>
  )
}
