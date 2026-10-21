import { describe, expect, it } from 'vitest'
import { getAuthDestination, getAuthErrorMessage } from '@/lib/auth'

describe('Post-authentication destinations', () => {
  it('uses the correct default destination for patient/admin', () => {
    expect(getAuthDestination(false)).toBe('/dashboard')
    expect(getAuthDestination(true)).toBe('/admin')
  })
  it('restores a requested booking route including its query and hash', () => {
    expect(getAuthDestination(false, '/book?doctor=123#slots')).toBe('/book?doctor=123#slots')
  })
  it('keeps admin destinations restricted to admins', () => {
    expect(getAuthDestination(false, '/admin')).toBe('/dashboard')
    expect(getAuthDestination(true, '/admin')).toBe('/admin')
  })
  it.each(['https://example.com', '//example.com', '/login', '/register', '/unknown', '/admin-other', {}, null])('rejects unsafe or unsupported destination %j', (path) => {
    expect(getAuthDestination(false, path)).toBe('/dashboard')
  })
})

describe('Authentication errors', () => {
  it('handles rate limits, disabled signup, and weak passwords', () => {
    expect(getAuthErrorMessage({ status: 429 }, 'login')).toMatch(/Too many attempts/)
    expect(getAuthErrorMessage({ code: 'signup_disabled' }, 'register')).toMatch(/unavailable/)
    expect(getAuthErrorMessage({ code: 'weak_password' }, 'register')).toMatch(/stronger password/)
  })
  it('uses a safe fallback for unexpected errors', () => {
    expect(getAuthErrorMessage(new Error('Private database details'), 'register')).toBe('We could not create your account. Please try again.')
    expect(getAuthErrorMessage(null, 'login')).toBe('We could not sign you in. Please try again.')
  })

  it.each([
    ['email_address_not_authorized', 'email service'],
    ['email_address_invalid', 'valid email address'],
    ['email_provider_disabled', 'currently unavailable'],
    ['captcha_failed', 'security check'],
    ['request_timeout', 'too long'],
    ['unexpected_failure', 'account service'],
  ])('explains the registration error %s', (code, message) => {
    expect(getAuthErrorMessage({ code }, 'register')).toContain(message)
  })

  it('identifies a database signup failure without exposing SQL internals', () => {
    expect(getAuthErrorMessage({ code: 'unexpected_failure', message: 'Database error saving new user' }, 'register')).toBe('Your account could not be saved. Please contact the clinic to check the account setup.')
  })

  it('handles the invalid-email response from older API versions without echoing the address', () => {
    expect(getAuthErrorMessage({ code: 'validation_failed', message: 'Email address "example@example.test" is invalid' }, 'register')).toBe('Use a valid email address you can access. Check the spelling and try again.')
  })
})
