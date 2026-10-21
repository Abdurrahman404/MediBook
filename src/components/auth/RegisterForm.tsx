import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { getAuthErrorMessage } from '@/lib/auth'
import { registerSchema, type RegisterFormValues } from '@/schemas/bookingSchema'
import { AuthInput } from './AuthInput'

export function RegisterForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', phone: '', password: '', confirm_password: '' },
  })

  async function submit(values: RegisterFormValues) {
    setSubmitError(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email, password: values.password,
        options: {
          data: { full_name: values.full_name, phone: values.phone || null },
          emailRedirectTo: new URL('/login', window.location.origin).href,
        },
      })
      if (error) throw error
      if (!data.session) setConfirmationEmail(values.email)
      // With confirmation disabled, the SDK signs in and the auth page redirects.
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'register'))
    }
  }

  if (confirmationEmail) return (
    <div role="status" className="space-y-3 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      <h2 className="font-semibold">Check your email</h2>
      <p>Check <span className="break-all font-medium">{confirmationEmail}</span> for a confirmation link to finish setting up your account.</p>
      <p>If you already have an account, you can sign in.</p>
      <Link to="/login" className="inline-block font-semibold underline">Continue to sign in</Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(submit)} noValidate aria-label="Create account" aria-busy={isSubmitting}>
      {submitError && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
      <fieldset disabled={isSubmitting} className="space-y-4">
        <AuthInput id="register-name" label="Full name" autoComplete="name" required
          {...register('full_name')} error={errors.full_name?.message} />
        <AuthInput id="register-email" label="Email address" type="email" autoComplete="email" required
          {...register('email')} error={errors.email?.message} />
        <AuthInput id="register-phone" label="Mobile number (optional)" type="tel" autoComplete="tel-national" inputMode="tel"
          {...register('phone')} placeholder="077 123 4567" hint="Sri Lankan mobile number, e.g. 0771234567 or +94771234567." error={errors.phone?.message} />
        <AuthInput id="register-password" label="Password" type="password" autoComplete="new-password" required
          {...register('password')} hint="At least 8 characters, one uppercase letter, and one number." error={errors.password?.message} />
        <AuthInput id="register-confirm-password" label="Confirm password" type="password" autoComplete="new-password" required
          {...register('confirm_password')} error={errors.confirm_password?.message} />
        <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </fieldset>
    </form>
  )
}
