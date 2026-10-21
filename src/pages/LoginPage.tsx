import { Link, useLocation } from 'react-router-dom'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  const location = useLocation()
  const state = location.state as { from?: unknown } | null
  return (
    <AuthPageLayout title="Sign in" subtitle="Welcome back. Sign in to manage your appointments.">
      <LoginForm />
      <p className="mt-6 text-center text-sm text-gray-600">
        New to MediBook?{' '}
        <Link to="/register" state={{ from: state?.from }} className="rounded font-semibold text-brand-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">Create an account</Link>
      </p>
    </AuthPageLayout>
  )
}
