import { Routes, Route, Navigate } from 'react-router-dom'
import { CalendarHeart, Clock3 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminRoute } from '@/components/layout/ProtectedRoute'
import { AuthNotice } from '@/components/auth/AuthNotice'

// Pages
import { LandingPage }       from '@/pages/LandingPage'
import { LoginPage }          from '@/pages/LoginPage'
import { RegisterPage }       from '@/pages/RegisterPage'
import { BookingPage }        from '@/pages/BookingPage'
import { PatientDashboard }   from '@/pages/PatientDashboard'
import { AdminDashboard }     from '@/pages/AdminDashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AuthNotice />
      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient-protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/book"       element={<BookingPage />} />
          <Route path="/dashboard"  element={<PatientDashboard />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-display font-semibold text-brand-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-900 text-white"><CalendarHeart className="h-4 w-4" aria-hidden="true" /></span>
              MediBook Healthcare
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs text-gray-700">
              <Clock3 className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
              Clinic timezone: Asia/Colombo (GMT+5:30)
            </span>
          </div>
          <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 text-sm text-gray-600 sm:grid-cols-3">
            <div><p className="font-semibold text-gray-800">MediBook Clinic</p><p className="mt-1">Specialist appointments, made simpler.</p></div>
            <div><p className="font-semibold text-gray-800">Patient support</p><p className="mt-1">Manage your bookings from My Appointments.</p></div>
            <div><p className="font-semibold text-gray-800">Account access</p><p className="mt-1">Your account details are managed securely.</p></div>
          </div>
          <p className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500">© {new Date().getFullYear()} MediBook. Appointment times are shown in Sri Lanka Standard Time.</p>
        </div>
      </footer>
    </div>
  )
}
