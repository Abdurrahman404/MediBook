import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { getAuthErrorMessage } from '@/lib/auth'
import { loginSchema, type LoginFormValues } from '@/schemas/bookingSchema'
import { AuthInput } from './AuthInput'

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  })

  async function submit(values: LoginFormValues) {
    setSubmitError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword(values)
      if (error) throw error
      if (!data.session) throw new Error('No session returned')
      // AuthProvider resolves the profile before AuthPageLayout redirects.
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'login'))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate aria-label="Sign in" aria-busy={isSubmitting}>
      {submitError && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
      <fieldset disabled={isSubmitting} className="space-y-5">
        <AuthInput id="login-email" label="Email address" type="email" autoComplete="username" required
          {...register('email')} error={errors.email?.message} />
        <AuthInput id="login-password" label="Password" type="password" autoComplete="current-password" required
          {...register('password')} error={errors.password?.message} />
        <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </fieldset>
    </form>
  )
}
