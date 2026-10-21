import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import App from '@/App'
import { deferred, makeProfile, makeSession } from './helpers/authFixtures'

const api = vi.hoisted(() => ({
  getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), signIn: vi.fn(), signUp: vi.fn(),
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), abortSignal: vi.fn(), single: vi.fn(), unsubscribe: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ supabase: {
  auth: { getSession: api.getSession, onAuthStateChange: api.onAuthStateChange, signOut: api.signOut, signInWithPassword: api.signIn, signUp: api.signUp },
  from: api.from,
} }))

let listener: (event: AuthChangeEvent, session: Session | null) => void
let auth: ReturnType<typeof useAuth>
let client: QueryClient

function Probe() {
  auth = useAuth()
  return <output data-testid="auth">{JSON.stringify({
    user: auth.user?.id ?? null, role: auth.profile?.role ?? null,
    loading: auth.isLoading, admin: auth.isAdmin, error: auth.error,
  })}</output>
}

function mount(strict = false) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const content = <QueryClientProvider client={client}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>
  return render(strict ? <StrictMode>{content}</StrictMode> : content)
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getSession.mockResolvedValue({ data: { session: null }, error: null })
  api.onAuthStateChange.mockImplementation((callback) => {
    listener = callback
    return { data: { subscription: { unsubscribe: api.unsubscribe } } }
  })
  api.signOut.mockResolvedValue({ error: null })
  api.from.mockReturnValue({ select: api.select, eq: api.eq, order: api.order, abortSignal: api.abortSignal, single: api.single })
  api.select.mockReturnThis(); api.eq.mockReturnThis(); api.order.mockReturnThis(); api.abortSignal.mockReturnThis()
  api.single.mockResolvedValue({ data: makeProfile(), error: null })
})
afterEach(() => { cleanup(); client?.clear(); vi.useRealTimers() })

describe('AuthProvider', () => {
  it('resolves an anonymous session without requesting a profile', async () => {
    mount()
    await waitFor(() => expect(auth.isLoading).toBe(false))
    expect(auth.session).toBeNull()
    expect(api.from).not.toHaveBeenCalled()
  })

  it.each(['patient', 'admin'] as const)('restores a persisted %s session and its profile', async (role) => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.single.mockResolvedValue({ data: makeProfile('patient-1', role), error: null })
    mount()
    await waitFor(() => expect(auth.profile?.role).toBe(role))
    expect(auth.isLoading).toBe(false)
    expect(auth.isAdmin).toBe(role === 'admin')
    expect(api.eq).toHaveBeenCalledWith('id', 'patient-1')
  })

  it('keeps auth callbacks synchronous and fetches profiles in a later effect', async () => {
    mount()
    await waitFor(() => expect(auth.isLoading).toBe(false))
    act(() => {
      expect(listener('SIGNED_IN', makeSession())).toBeUndefined()
      expect(api.single).not.toHaveBeenCalled()
    })
    await waitFor(() => expect(auth.profile?.id).toBe('patient-1'))
  })

  it('does not let a stale session restore overwrite a newer sign-out event', async () => {
    const restore = deferred<{ data: { session: Session }; error: null }>()
    api.getSession.mockReturnValue(restore.promise)
    mount()
    act(() => listener('SIGNED_OUT', null))
    await act(async () => restore.resolve({ data: { session: makeSession() }, error: null }))
    expect(auth.session).toBeNull()
    expect(api.from).not.toHaveBeenCalled()
  })

  it('shows a recoverable session error rather than leaving the spinner running', async () => {
    api.getSession.mockRejectedValue(new Error('Network unavailable'))
    mount()
    await waitFor(() => expect(auth.error).toMatch(/restore your session/))
    expect(auth.isLoading).toBe(false)
    api.getSession.mockResolvedValue({ data: { session: null }, error: null })
    act(() => auth.retryAuth())
    await waitFor(() => expect(auth.error).toBeNull())
  })

  it('handles a returned session error', async () => {
    api.getSession.mockResolvedValue({ data: { session: null }, error: new Error('Invalid refresh token') })
    mount()
    await waitFor(() => expect(auth.error).toBeTruthy())
    expect(auth.isLoading).toBe(false)
  })

  it('stops waiting for a stalled initial session after 15 seconds', async () => {
    vi.useFakeTimers()
    api.getSession.mockReturnValue(new Promise(() => {}))
    mount()
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(auth.isLoading).toBe(false)
    expect(auth.error).toMatch(/too long/)
  })

  it('keeps admin access disabled on profile failure and supports retry', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.single.mockResolvedValueOnce({ data: null, error: new Error('Offline') })
    mount()
    await waitFor(() => expect(auth.error).toMatch(/load your account/))
    expect(auth.isLoading).toBe(false)
    expect(auth.isAdmin).toBe(false)
    act(() => auth.retryAuth())
    await waitFor(() => expect(auth.profile?.id).toBe('patient-1'))
    expect(auth.error).toBeNull()
  })

  it('handles a missing profile and rejected profile request', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.single.mockResolvedValueOnce({ data: null, error: null })
    mount()
    await waitFor(() => expect(auth.error).toMatch(/load your account/))
    api.single.mockRejectedValueOnce(new Error('Fetch failed'))
    act(() => auth.retryAuth())
    await waitFor(() => expect(api.single).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(auth.isLoading).toBe(false))
    expect(auth.error).toMatch(/load your account/)
  })

  it('times out stalled profile requests and ignores their late responses', async () => {
    vi.useFakeTimers()
    const pending = deferred<{ data: ReturnType<typeof makeProfile>; error: null }>()
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.single.mockReturnValue(pending.promise)
    mount()
    await act(async () => {})
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(auth.isLoading).toBe(false)
    expect(auth.error).toMatch(/load your account/)
    await act(async () => pending.resolve({ data: makeProfile('patient-1', 'admin'), error: null }))
    expect(auth.isAdmin).toBe(false)
  })

  it('ignores another account\'s late profile and clears account caches', async () => {
    const pending = deferred<{ data: ReturnType<typeof makeProfile>; error: null }>()
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.single.mockReturnValueOnce(pending.promise)
    mount()
    await waitFor(() => expect(api.single).toHaveBeenCalledOnce())
    client.setQueryData(['appointments', 'patient-1'], ['private data'])
    api.single.mockResolvedValue({ data: makeProfile('patient-2'), error: null })
    act(() => listener('SIGNED_IN', makeSession('patient-2')))
    await waitFor(() => expect(auth.profile?.id).toBe('patient-2'))
    await act(async () => pending.resolve({ data: makeProfile('patient-1', 'admin'), error: null }))
    expect(auth.user?.id).toBe('patient-2')
    expect(auth.isAdmin).toBe(false)
    expect(client.getQueryData(['appointments', 'patient-1'])).toBeUndefined()
  })

  it('updates refreshed tokens without clearing the same account cache', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    mount()
    await waitFor(() => expect(auth.profile).toBeTruthy())
    client.setQueryData(['appointments'], ['own data'])
    act(() => listener('TOKEN_REFRESHED', { ...makeSession(), access_token: 'refreshed-token' }))
    expect(auth.session?.access_token).toBe('refreshed-token')
    expect(client.getQueryData(['appointments'])).toEqual(['own data'])
  })

  it('signs out locally and clears the profile and cached account data', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    mount()
    await waitFor(() => expect(auth.profile).toBeTruthy())
    client.setQueryData(['appointments'], ['private data'])
    await act(async () => { await auth.signOut() })
    expect(api.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(auth.session).toBeNull()
    expect(auth.profile).toBeNull()
    expect(client.getQueryData(['appointments'])).toBeUndefined()
  })

  it('does not pretend sign-out succeeded when Supabase returns an error', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.signOut.mockResolvedValue({ error: new Error('Offline') })
    mount()
    await waitFor(() => expect(auth.profile).toBeTruthy())
    await expect(auth.signOut()).rejects.toThrow('Offline')
    expect(auth.user?.id).toBe('patient-1')
  })

  it('handles session expiration or sign-out in another tab', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    mount()
    await waitFor(() => expect(auth.profile).toBeTruthy())
    act(() => listener('SIGNED_OUT', null))
    expect(auth.session).toBeNull()
    expect(auth.profile).toBeNull()
    expect(auth.isAdmin).toBe(false)
  })

  it('cleans up subscriptions in StrictMode and aborts profile requests on unmount', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    const view = mount(true)
    await waitFor(() => expect(auth.profile).toBeTruthy())
    const signal = api.abortSignal.mock.calls[api.abortSignal.mock.calls.length - 1][0] as AbortSignal
    view.unmount()
    expect(api.unsubscribe).toHaveBeenCalledTimes(2)
    expect(signal.aborted).toBe(true)
  })

  it('explains when useAuth is used without its provider', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow('useAuth must be used inside <AuthProvider>')
    log.mockRestore()
    expect(screen.queryByTestId('auth')).toBeNull()
  })
})

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search + location.hash}</output>
}

function mountApp(path: string) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={client}>
        <AuthProvider><App /><LocationProbe /></AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

async function enterLogin() {
  fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'patient@example.test' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1' } })
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('Authentication flows with the real provider and route guards', () => {
  beforeEach(() => {
    api.signIn.mockImplementation(async () => {
      listener('SIGNED_IN', makeSession())
      return { data: { session: makeSession(), user: makeSession().user }, error: null }
    })
  })

  it('returns a patient to the requested booking route after login', async () => {
    mountApp('/book?doctor=123#slots')
    await enterLogin()
    expect(await screen.findByRole('heading', { name: 'Book an Appointment' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/book?doctor=123#slots')
    expect(screen.getByText('Test Patient')).toBeInTheDocument()
  })

  it('waits for an admin profile before deciding the login destination', async () => {
    const profile = deferred<{ data: ReturnType<typeof makeProfile>; error: null }>()
    api.single.mockReturnValue(profile.promise)
    mountApp('/login')
    await enterLogin()
    expect(await screen.findByText('Loading your account…')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    await act(async () => profile.resolve({ data: makeProfile('patient-1', 'admin'), error: null }))
    expect(await screen.findByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
  })

  it('redirects a patient who requested admin access to their own dashboard', async () => {
    mountApp('/admin')
    await enterLogin()
    expect(await screen.findByRole('heading', { name: 'My Appointments' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull()
  })

  it('preserves the requested destination when switching from login to registration', async () => {
    api.signUp.mockImplementation(async () => {
      listener('SIGNED_IN', makeSession())
      return { data: { session: makeSession(), user: makeSession().user }, error: null }
    })
    mountApp('/book')
    await screen.findByLabelText('Email address')
    await userEvent.click(screen.getByRole('link', { name: 'Create an account' }))
    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Test Patient' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'patient@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Password1' } })
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('heading', { name: 'Book an Appointment' })).toBeInTheDocument()
  })

  it('keeps email-confirmation registrations signed out until a session is issued', async () => {
    api.signUp.mockResolvedValue({ data: { session: null, user: makeSession().user }, error: null })
    mountApp('/register')
    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Test Patient' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'patient@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Password1' } })
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/register')
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull()
  })

  it.each(['/login', '/register'])('redirects an already signed-in user away from %s', async (path) => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    mountApp(path)
    expect(await screen.findByRole('heading', { name: 'My Appointments' })).toBeInTheDocument()
  })

  it('signs out to the landing page and clears private caches', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.signOut.mockImplementation(async () => {
      listener('SIGNED_OUT', null)
      return { error: null }
    })
    mountApp('/dashboard')
    await screen.findByRole('heading', { name: 'My Appointments' })
    client.setQueryData(['appointments'], ['private data'])
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'MediBook' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull()
    expect(client.getQueryData(['appointments'])).toBeUndefined()
  })

  it('shows a sign-out failure without navigating away or losing the session', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.signOut.mockResolvedValue({ error: new Error('Offline') })
    mountApp('/dashboard')
    await screen.findByRole('heading', { name: 'My Appointments' })
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not sign you out')
    expect(screen.getByRole('heading', { name: 'My Appointments' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
  })

  it('shows recovery controls when an admin profile cannot load, then retries', async () => {
    api.getSession.mockResolvedValue({ data: { session: makeSession() }, error: null })
    api.single.mockResolvedValueOnce({ data: null, error: new Error('Private DB error') })
    api.single.mockResolvedValue({ data: makeProfile('patient-1', 'admin'), error: null })
    mountApp('/admin')
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your account')
    expect(screen.queryByRole('heading', { name: 'Admin Dashboard' })).toBeNull()
    expect(screen.queryByText('Private DB error')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument()
  })
})
