import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'

const auth = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  profile: null,
  isAdmin: false,
  isLoading: false,
  signOut: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }))

function visit(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  auth.session = null
  auth.isAdmin = false
  auth.isLoading = false
})

afterEach(cleanup)

describe('Phase 1 routes', () => {
  it.each([
    ['/', 'MediBook'],
    ['/login', 'Sign in'],
    ['/register', 'Create an account'],
  ])('renders the public route %s', (path, heading) => {
    visit(path)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument()
  })

  it.each(['/book', '/dashboard', '/admin'])('redirects anonymous visitors from %s to login', (path) => {
    visit(path)
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it.each([
    ['/book', 'Book an Appointment', false],
    ['/dashboard', 'My Appointments', false],
    ['/admin', 'Admin Dashboard', true],
  ] as const)('renders %s for an authorized user', (path, heading, isAdmin) => {
    auth.session = { user: { id: 'test-user' } }
    auth.isAdmin = isAdmin
    visit(path)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('redirects a patient away from the admin route', () => {
    auth.session = { user: { id: 'patient' } }
    visit('/admin')
    expect(screen.getByRole('heading', { name: 'My Appointments' })).toBeInTheDocument()
  })

  it('waits for authentication before redirecting', () => {
    auth.isLoading = true
    visit('/book')
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('redirects unknown routes to the landing page', () => {
    visit('/unknown')
    expect(screen.getByRole('heading', { name: 'MediBook' })).toBeInTheDocument()
  })
})
