import { Link, useNavigate } from 'react-router-dom'
import { CalendarHeart, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function Navbar() {
  const { session, isAdmin, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-y-2 py-3 sm:py-0">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-brand-700">
            <CalendarHeart className="h-6 w-6 text-brand-600" />
            <span className="text-xl font-bold tracking-tight">MediBook</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {session ? (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
                      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/book"
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
                        'text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                      )}
                    >
                      Book Appointment
                    </Link>
                    <Link
                      to="/dashboard"
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
                        'text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      My Appointments
                    </Link>
                  </>
                )}

                {/* User + sign out */}
                <div className="ml-4 flex items-center gap-3 border-l pl-4">
                  <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[140px]">
                    {profile?.full_name ?? profile?.email ?? session.user.email ?? 'Account'}
                  </span>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
                      'text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-60'
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    {isSigningOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    'ml-2 rounded-md px-4 py-2 text-sm font-semibold',
                    'bg-brand-600 text-white hover:bg-brand-700 transition-colors'
                  )}
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
      {signOutError && <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{signOutError}</p>}
    </header>
  )
}
