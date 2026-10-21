import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { deferred, makeSession } from '../helpers/authFixtures'

const signIn = vi.mocked(supabase.auth.signInWithPassword)
const signUp = vi.mocked(supabase.auth.signUp)

beforeEach(() => { signIn.mockReset(); signUp.mockReset() })
afterEach(cleanup)

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}
function fillLogin() {
  fill(/^Email address$/, 'patient@example.test')
  fill(/^Password$/, 'Password1')
}
function fillRegistration() {
  fill(/^Full name$/, 'Test Patient')
  fill(/^Email address$/, 'patient@example.test')
  fill(/^Password$/, 'Password1')
  fill(/^Confirm password$/, 'Password1')
}
function registerForm() {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><RegisterForm /></MemoryRouter>)
}

describe('LoginForm', () => {
  it('validates email and password before contacting Supabase', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true')
  })

  it('trims email but preserves the exact password', async () => {
    signIn.mockResolvedValue({ data: { session: makeSession(), user: makeSession().user }, error: null })
    render(<LoginForm />)
    fill(/^Email address$/, ' patient@example.test ')
    fill(/^Password$/, ' Password1 ')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(signIn).toHaveBeenCalledWith({ email: 'patient@example.test', password: ' Password1 ' }))
  })

  it('disables fields and duplicate submission while signing in', async () => {
    const pending = deferred<Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>>()
    signIn.mockReturnValue(pending.promise)
    render(<LoginForm />)
    fillLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    const button = await screen.findByRole('button', { name: 'Signing in…' })
    expect(button).toBeDisabled()
    expect(screen.getByLabelText('Email address')).toBeDisabled()
    await userEvent.click(button)
    expect(signIn).toHaveBeenCalledOnce()
    await act(async () => pending.resolve({ data: { session: makeSession(), user: makeSession().user }, error: null }))
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it.each([
    ['invalid_credentials', 'Incorrect email or password.'],
    ['email_not_confirmed', 'Confirm your email address before signing in.'],
    ['over_request_rate_limit', 'Too many attempts. Please wait a few minutes and try again.'],
  ])('explains the %s error', async (code, message) => {
    signIn.mockResolvedValue({ data: { session: null, user: null }, error: { code, message: 'API error', name: 'AuthApiError' } } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>)
    render(<LoginForm />)
    fillLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })

  it('handles network exceptions and lets the user retry', async () => {
    signIn.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    signIn.mockResolvedValue({ data: { session: makeSession(), user: makeSession().user }, error: null })
    render(<LoginForm />)
    fillLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Check your internet connection')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('reveals and hides a password without submitting the form', async () => {
    render(<LoginForm />)
    fillLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    expect(signIn).not.toHaveBeenCalled()
  })
})

describe('RegisterForm', () => {
  it('rejects blank fields, short passwords, and malformed email addresses', async () => {
    registerForm()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Full name must be at least 2 characters')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('rejects mismatched passwords and invalid optional phone numbers', async () => {
    registerForm()
    fillRegistration()
    fill(/^Mobile number/, '123')
    fill(/^Confirm password$/, 'Different1')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(screen.getByText('Enter a Sri Lankan mobile number, such as 0771234567 or +94771234567')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('sends only permitted profile metadata and handles email confirmation', async () => {
    signUp.mockResolvedValue({ data: { session: null, user: makeSession().user }, error: null })
    registerForm()
    fillRegistration()
    fill(/^Full name$/, ' Test Patient ')
    fill(/^Mobile number/, ' +94 77 123 4567 ')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Check your email')
    expect(screen.getByRole('status')).toHaveTextContent('patient@example.test')
    expect(signUp).toHaveBeenCalledWith({
      email: 'patient@example.test', password: 'Password1',
      options: {
        data: { full_name: 'Test Patient', phone: '0771234567' },
        emailRedirectTo: new URL('/login', window.location.origin).href,
      },
    })
    expect(screen.queryByRole('form')).toBeNull()
    expect(screen.getByRole('link', { name: 'Continue to sign in' })).toHaveAttribute('href', '/login')
  })

  it('accepts an omitted phone number and immediate signup sessions', async () => {
    signUp.mockResolvedValue({ data: { session: makeSession(), user: makeSession().user }, error: null })
    registerForm()
    fillRegistration()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(signUp).toHaveBeenCalledOnce())
    expect(signUp.mock.calls[0][0]).toMatchObject({ options: { data: { phone: null } } })
    expect(screen.queryByText('Check your email')).toBeNull()
  })

  it('disables duplicate registration while a request is pending', async () => {
    const pending = deferred<Awaited<ReturnType<typeof supabase.auth.signUp>>>()
    signUp.mockReturnValue(pending.promise)
    registerForm()
    fillRegistration()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    const button = await screen.findByRole('button', { name: 'Creating account…' })
    expect(button).toBeDisabled()
    expect(screen.getByLabelText('Full name')).toBeDisabled()
    await userEvent.click(button)
    expect(signUp).toHaveBeenCalledOnce()
    await act(async () => pending.resolve({ data: { session: null, user: makeSession().user }, error: null }))
    expect(await screen.findByRole('status')).toHaveTextContent('Check your email')
  })

  it('handles duplicate accounts without exposing internal API errors', async () => {
    signUp.mockRejectedValue({ code: 'user_already_exists', message: 'Internal details' })
    registerForm()
    fillRegistration()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists')
    expect(screen.queryByText('Internal details')).toBeNull()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
  })

  it.each([
    ['email_address_not_authorized', 'Confirmation email could not be sent'],
    ['email_address_invalid', 'Use a valid email address you can access'],
    ['unexpected_failure', 'The account service could not finish registration'],
  ])('explains registration failure %s', async (code, message) => {
    signUp.mockRejectedValue({ code, message: 'API error' })
    registerForm()
    fillRegistration()
    fill(/^Mobile number/, '077 123 4567')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
  })
})
