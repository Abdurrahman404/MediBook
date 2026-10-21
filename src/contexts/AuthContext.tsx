import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  error: string | null
  retryAuth: () => void
  signOut: () => Promise<void>
}

interface ProfileState {
  userId: string | null
  profile: Profile | null
  loading: boolean
  error: string | null
}

const emptyProfile: ProfileState = { userId: null, profile: null, loading: false, error: null }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [profileState, setProfileState] = useState<ProfileState>(emptyProfile)
  const [retry, setRetry] = useState(0)
  const currentUserId = useRef<string | null>(null)
  const userId = session?.user.id ?? null

  useEffect(() => {
    let active = true
    let receivedEvent = false
    const timeout = window.setTimeout(() => {
      if (!active || receivedEvent) return
      setSessionError('Restoring your session took too long. Check your connection and try again.')
      setSessionLoading(false)
    }, 15000)

    function acceptSession(next: Session | null) {
      if (!active) return
      window.clearTimeout(timeout)
      const nextId = next?.user.id ?? null
      if (nextId !== currentUserId.current) {
        // Remove another account's cached appointment/admin data before rendering.
        queryClient.clear()
        currentUserId.current = nextId
      }
      setSession(next)
      setSessionError(null)
      setSessionLoading(false)
    }

    // Keep callbacks synchronous. Profile requests run in the separate effect below.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      receivedEvent = true
      acceptSession(next)
    })

    supabase.auth.getSession().then(({ data, error }) => {
      // A later auth event takes precedence over an older session restore result.
      if (!active || receivedEvent) return
      if (error) throw error
      acceptSession(data.session)
    }).catch(() => {
      if (!active || receivedEvent) return
      window.clearTimeout(timeout)
      setSessionError('We could not restore your session. Try again or sign in.')
      setSessionLoading(false)
    })

    return () => {
      active = false
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [queryClient, retry])

  useEffect(() => {
    if (!userId) {
      setProfileState(emptyProfile)
      return
    }
    let active = true
    const controller = new AbortController()
    setProfileState({ userId, profile: null, loading: true, error: null })
    const profileFailure: ProfileState = {
      userId, profile: null, loading: false,
      error: 'We could not load your account. Try again, or sign out and sign in again.',
    }
    const timeout = window.setTimeout(() => {
      if (!active) return
      active = false
      controller.abort()
      setProfileState(profileFailure)
    }, 15000)

    async function loadProfile() {
      try {
        const { data, error } = await supabase.from('profiles').select('*')
          .eq('id', userId!).abortSignal(controller.signal).single()
        if (error || !data) throw error ?? new Error('Profile missing')
        if (active) setProfileState({ userId, profile: data, loading: false, error: null })
      } catch {
        if (active) setProfileState(profileFailure)
      } finally {
        window.clearTimeout(timeout)
      }
    }
    void loadProfile()
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [userId, retry])

  const profileMatches = profileState.userId === userId
  const profile = profileMatches ? profileState.profile : null
  const isLoading = sessionLoading || (!!userId && (!profileMatches || profileState.loading))
  const error = sessionError ?? (profileMatches ? profileState.error : null)

  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
    queryClient.clear()
    currentUserId.current = null
    setSession(null)
    setProfileState(emptyProfile)
    setSessionError(null)
    setSessionLoading(false)
  }

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, profile, isLoading,
      isAdmin: profile?.role === 'admin', error,
      retryAuth: () => setRetry((value) => value + 1), signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
