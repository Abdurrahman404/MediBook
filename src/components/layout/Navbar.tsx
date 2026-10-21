import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CalendarHeart, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { session, isAdmin, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    setSignOutError(null)
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch {
      setSignOutError('We could not sign you out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) => cn(
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-100 text-brand-900' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-900',
  )

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-brand-900">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-900 text-white">
            <CalendarHeart className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">MediBook</span>
        </Link>

        <nav aria-label="Main navigation" className={cn(
          'order-3 w-full flex-wrap items-center gap-1 pb-1 md:order-none md:flex md:w-auto md:pb-0',
          mobileOpen ? 'flex' : 'hidden',
        )}>
          <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>Find Doctors</NavLink>
          {session && !isAdmin && (
            <>
              <NavLink to="/book" className={navLinkClass} onClick={() => setMobileOpen(false)}>Book Visit</NavLink>
              <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> My Appointments
              </NavLink>
            </>
          )}
          {session && isAdmin && (
            <NavLink to="/admin" aria-label="Admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Clinic Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {session ? (
            <>
              {!isAdmin && (
                <Link to="/book" className="hidden rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 sm:inline-flex">
                  Book Appointment
                </Link>
              )}
              <span className="hidden max-w-36 truncate border-l border-gray-200 pl-3 text-sm text-gray-600 md:inline">
                {profile?.full_name ?? profile?.email ?? session.user.email ?? 'Account'}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-900">Sign in</Link>
              <Link to="/register" className="rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Get started</Link>
            </>
          )}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-lg text-gray-700 hover:bg-brand-50 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {signOutError && <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{signOutError}</p>}
    </header>
  )
}
