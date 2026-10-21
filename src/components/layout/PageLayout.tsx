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
    <main className={cn('page-container animate-fade-in min-h-[calc(100vh-4rem)]', className)}>
      {(title || actions) && (
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {title && (
              <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </main>
  )
}
