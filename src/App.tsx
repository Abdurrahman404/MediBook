import { Routes, Route, Navigate } from 'react-router-dom'
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
    </div>
  )
}
