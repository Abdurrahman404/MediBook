/** Only known internal destinations may be restored after authentication. */
export function getAuthDestination(isAdmin: boolean, requested?: unknown): string {
  const fallback = isAdmin ? '/admin' : '/dashboard'
  if (typeof requested !== 'string') return fallback
  const path = requested.split(/[?#]/)[0]
  if (!['/book', '/dashboard', '/admin'].includes(path)) return fallback
  if (path === '/admin' && !isAdmin) return '/dashboard'
  return requested
}

export function getAuthErrorMessage(error: unknown, action: 'login' | 'register'): string {
  const candidate = error as { code?: string; message?: string; status?: number } | null
  const code = candidate?.code
  if (code === 'invalid_credentials' || candidate?.message === 'Invalid login credentials') {
    return 'Incorrect email or password.'
  }
  if (code === 'email_not_confirmed') return 'Confirm your email address before signing in.'
  if (code === 'email_address_invalid' || (
    (!code || code === 'validation_failed') && /^email address .+ is invalid\.?$/i.test(candidate?.message ?? '')
  )) return 'Use a valid email address you can access. Check the spelling and try again.'
  if (code === 'email_address_not_authorized') return 'Confirmation email could not be sent. The clinic needs to configure its email service before accepting this email address.'
  if (code === 'email_provider_disabled') return 'Email registration is currently unavailable. Please contact the clinic.'
  if (code === 'captcha_failed') return 'Registration requires a security check that is not configured in this app. Please contact the clinic.'
  if (code === 'request_timeout' || candidate?.status === 504) return 'The account service took too long to respond. Please try again.'
  if (code === 'unexpected_failure' && /database error saving new user/i.test(candidate?.message ?? '')) {
    return 'Your account could not be saved. Please contact the clinic to check the account setup.'
  }
  if (code === 'unexpected_failure' || code === 'email_send_failed' || (candidate?.status ?? 0) >= 500) {
    return action === 'register'
      ? 'The account service could not finish registration. Please contact the clinic or try again later.'
      : 'The account service is temporarily unavailable. Please try again later.'
  }
  if (['user_already_exists', 'email_exists'].includes(code ?? '') || candidate?.message === 'User already registered') {
    return 'An account with this email already exists. Try signing in.'
  }
  if (code === 'signup_disabled') return 'Registration is currently unavailable. Please contact the clinic.'
  if (code === 'weak_password') return 'Choose a stronger password with at least 8 characters, one uppercase letter, and one number.'
  if (candidate?.status === 429 || ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code ?? '')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (error instanceof TypeError || /fetch|network|connection/i.test(candidate?.message ?? '')) {
    return 'Unable to connect. Check your internet connection and try again.'
  }
  return action === 'login'
    ? 'We could not sign you in. Please try again.'
    : 'We could not create your account. Please try again.'
}
