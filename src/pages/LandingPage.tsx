import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, CalendarHeart, Check, Clock3, LockKeyhole, ShieldCheck, Stethoscope } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDoctors } from '@/hooks/useDoctors'

const workflow = [
  { number: '01', icon: Stethoscope, title: 'Choose your specialist', description: 'Browse clinic doctors by specialty and find the right care for your needs.' },
  { number: '02', icon: CalendarCheck2, title: 'Select a date and time', description: 'See future availability and reserve a convenient appointment slot.' },
  { number: '03', icon: Check, title: 'Get confirmation', description: 'Receive your booking details and manage the visit from your account.' },
]

const assurances = [
  { icon: ShieldCheck, title: 'Verified clinic profiles', text: 'Review doctor specialties and consultation details before booking.' },
  { icon: LockKeyhole, title: 'Privacy by design', text: 'Supabase authentication and database policies protect account access.' },
  { icon: Clock3, title: 'Clear availability', text: 'Choose from available appointment times in the clinic timezone.' },
  { icon: CalendarHeart, title: 'Manage your visits', text: 'Keep upcoming and past appointments together in one place.' },
]

export function LandingPage() {
  const { session, isAdmin, profile } = useAuth()
  const doctorsQuery = useDoctors()
  const featuredDoctors = (doctorsQuery.data ?? []).slice(0, 3)

  return (
    <main className="min-h-screen bg-[#effcf9]">
      <div className="border-b border-brand-100 bg-brand-50/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-gray-600 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-600" /> Clinic appointments, made simpler</span>
          <span>Appointment times shown in Sri Lanka Standard Time (Asia/Colombo)</span>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-20">
        <div className="lg:col-span-7">
          <span className="clinic-eyebrow inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Thoughtful care, easier to arrange
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-brand-900 sm:text-5xl lg:text-[3.5rem]">
            Better care starts with a simpler appointment.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Find a specialist, choose a time that works for you, and keep your clinic visits organized in one calm, secure place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={session ? (isAdmin ? '/admin' : '/book') : '/register'} className="clinic-button">
              {session ? (isAdmin ? 'Open admin dashboard' : 'Find a specialist') : 'Get started'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {!session && <Link to="/login" className="rounded-lg px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-white">Sign in</Link>}
            {session && !isAdmin && <Link to="/dashboard" className="rounded-lg px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-white">My appointments</Link>}
            {session && <span className="w-full text-sm text-gray-500 sm:w-auto">Welcome, {profile?.full_name ?? 'back'}</span>}
          </div>
          <div className="mt-9 grid max-w-2xl grid-cols-1 gap-3 rounded-xl border border-brand-100 bg-white p-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 text-sm text-gray-700"><CalendarCheck2 className="h-5 w-5 text-brand-600" /> Simple online booking</div>
            <div className="flex items-center gap-3 text-sm text-gray-700"><Clock3 className="h-5 w-5 text-brand-600" /> Local appointment times</div>
            <div className="flex items-center gap-3 text-sm text-gray-700"><LockKeyhole className="h-5 w-5 text-brand-600" /> Protected accounts</div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-white p-5 sm:p-7">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-100/70" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="clinic-eyebrow">Your next step</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-brand-900">Care, on your schedule.</h2>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-800"><CalendarHeart className="h-6 w-6" aria-hidden="true" /></span>
              </div>
              <div className="mt-6 rounded-xl bg-[#effcf9] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Booking flow</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-800">About 2 minutes</span>
                </div>
                {workflow.map(({ number, title }, index) => (
                  <div key={number} className="flex items-center gap-3 py-4">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${index === 0 ? 'bg-brand-900 text-white' : 'bg-white text-brand-800'}`}>{number}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{title}</span>
                    {index === 0 && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                    {index < workflow.length - 1 && <span className="sr-only">Next</span>}
                  </div>
                ))}
                <Link to={session ? '/book' : '/register'} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
                  Start booking <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-4 text-center text-xs text-gray-500">All appointment times use Asia/Colombo (GMT+5:30).</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="clinic-eyebrow">How it works</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900">A clearer path to your visit</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">Three simple steps help you find care and keep the details close at hand.</p>
            </div>
            <Link to={session ? '/book' : '/register'} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900">
              {session ? 'Book a visit' : 'Create an account'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map(({ number, icon: Icon, title, description }) => (
              <article key={number} className="rounded-xl border border-brand-100 bg-[#effcf9] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-semibold text-brand-500">{number}</span>
                  <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-brand-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="clinic-eyebrow">Specialist directory</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900">Meet our practitioners</h2>
            <p className="mt-2 text-sm text-gray-600">Explore available specialists and choose a time that suits you.</p>
          </div>
          {doctorsQuery.isLoading ? (
            <p role="status" className="clinic-card p-6 text-sm text-gray-600">Loading specialists…</p>
          ) : doctorsQuery.error ? (
            <div className="clinic-card p-6 text-sm text-red-700" role="alert">We couldn’t load the specialist directory. Please visit the booking page to retry.</div>
          ) : featuredDoctors.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredDoctors.map((doctor) => (
                <article key={doctor.id} className="clinic-card flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-200">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-800"><Stethoscope className="h-6 w-6" aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <p className="clinic-eyebrow">{doctor.specialty}</p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-brand-900">{doctor.name}</h3>
                    </div>
                  </div>
                  {doctor.bio && <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">{doctor.bio}</p>}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    {doctor.consultation_fee !== null ? <span className="text-sm font-medium text-gray-700">{doctor.consultation_fee.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</span> : <span className="text-sm text-gray-500">Consultation fee varies</span>}
                    <Link to={session ? '/book' : '/register'} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">View availability <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="clinic-card p-6 text-sm text-gray-600">The specialist directory is being updated. Please check again soon.</div>
          )}
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="clinic-eyebrow">Care with confidence</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900">Designed around your peace of mind</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {assurances.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-xl border border-gray-200 p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-800"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="mt-4 font-display text-base font-semibold text-brand-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-2xl bg-brand-900 p-7 text-white sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">Your next visit starts here</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Make time for your health.</h2>
            <p className="mt-3 text-sm leading-6 text-brand-100">Find the right specialist and book your appointment online.</p>
          </div>
          <Link to={session ? (isAdmin ? '/admin' : '/book') : '/register'} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-500">
            {session ? (isAdmin ? 'Admin dashboard' : 'Book an appointment') : 'Create your account'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}
