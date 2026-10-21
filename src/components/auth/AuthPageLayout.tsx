import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { CalendarHeart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthDestination } from '@/lib/auth'

export function AuthPageLayout({ title, subtitle, children }: {
  title: string; subtitle: string; children: ReactNode
}) {
  const { session, isAdmin, isLoading, error } = useAuth()
  const location = useLocation()
  const state = location.state as { from?: unknown } | null
  if (!isLoading && session && !error) {
    return <Navigate to={getAuthDestination(isAdmin, state?.from)} replace />
  }
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="auth-title">
        <div className="mb-5 inline-flex rounded-xl bg-brand-50 p-3 text-brand-600"><CalendarHeart className="h-6 w-6" aria-hidden="true" /></div>
        <h1 id="auth-title" className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-500">{subtitle}</p>
        {isLoading ? <p role="status" className="py-6 text-center text-sm text-gray-600">Loading your account…</p> : children}
      </section>
    </main>
  )
}
