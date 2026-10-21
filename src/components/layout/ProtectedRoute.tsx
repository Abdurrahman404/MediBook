import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/** Spinner shown while session is loading on first mount */
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}

/**
 * ProtectedRoute — any authenticated user (patient or admin).
 * Unauthenticated users are redirected to /login.
 */
export function ProtectedRoute() {
  const { session, isLoading, error } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" state={{ from: location.pathname + location.search + location.hash }} replace />
  if (error) return null // AuthNotice provides retry/sign-out recovery.
  return <Outlet />
}

/**
 * AdminRoute — only users with role === 'admin'.
 * Non-admins are redirected to their patient dashboard.
 */
export function AdminRoute() {
  const { session, isAdmin, isLoading, error } = useAuth()
  const location = useLocation()
  if (isLoading)          return <LoadingScreen />
  if (!session)           return <Navigate to="/login" state={{ from: location.pathname + location.search + location.hash }} replace />
  if (error) return null
  if (!isAdmin)           return <Navigate to="/dashboard" replace />
  return <Outlet />
}
