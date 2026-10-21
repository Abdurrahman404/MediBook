import { Link, useLocation } from 'react-router-dom'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'

export function RegisterPage() {
  const location = useLocation()
  const state = location.state as { from?: unknown } | null
  return (
    <AuthPageLayout title="Create an account" subtitle="Join MediBook to book specialist visits and manage your appointments.">
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" state={{ from: state?.from }} className="rounded font-semibold text-brand-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">Sign in</Link>
      </p>
    </AuthPageLayout>
  )
}
