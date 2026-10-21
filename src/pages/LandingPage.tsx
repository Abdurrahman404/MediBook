import { Link } from 'react-router-dom'
import { CalendarHeart, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const features = [
  { icon: CalendarHeart, title: 'Easy Booking',       desc: 'Book appointments with specialists in under 2 minutes.' },
  { icon: Clock,         title: 'Live Availability',  desc: 'Real-time slot availability — no double-booking, ever.' },
  { icon: ShieldCheck,   title: 'Secure & Private',   desc: 'Your health information is encrypted and access-controlled.' },
  { icon: CheckCircle2,  title: 'Instant Confirmation', desc: 'Receive a booking reference the moment you confirm.' },
]

export function LandingPage() {
  const { session, isAdmin } = useAuth()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <CalendarHeart className="h-16 w-16 opacity-90" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            MediBook
          </h1>
          <p className="text-xl text-brand-100 mb-3">
            Clinic Appointment Management System
          </p>
          <p className="text-brand-200 max-w-xl mx-auto mb-8">
            Book specialist appointments instantly. Manage your healthcare visits
            from one place. Trusted by patients and clinic staff alike.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {session ? (
              <Link
                to={isAdmin ? '/admin' : '/book'}
                className="rounded-lg bg-white text-brand-700 px-6 py-3 font-semibold hover:bg-brand-50 transition-colors"
              >
                {isAdmin ? 'Go to Admin Dashboard' : 'Book an Appointment'}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-lg bg-white text-brand-700 px-6 py-3 font-semibold hover:bg-brand-50 transition-colors"
                >
                  Get started — it&apos;s free
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-white/40 text-white px-6 py-3 font-medium hover:bg-white/10 transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Everything you need for hassle-free appointments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <Icon className="h-8 w-8 text-brand-500 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
