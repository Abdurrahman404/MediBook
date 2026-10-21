import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Search } from 'lucide-react'
import { StatusBadge } from '@/components/appointments/StatusBadge'
import { PageLayout } from '@/components/layout/PageLayout'
import { useAppointments, useCancelAppointment } from '@/hooks/useAppointments'
import { formatClinicDateTime } from '@/lib/utils'
import type { AppointmentWithDoctor } from '@/types'

type AppointmentTab = 'upcoming' | 'past'

export function PatientDashboard() {
  const appointmentsQuery = useAppointments()
  const cancelAppointment = useCancelAppointment()
  const [tab, setTab] = useState<AppointmentTab>('upcoming')
  const [search, setSearch] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)

  const appointments = useMemo(() => {
    const now = Date.now()
    const filtered = (appointmentsQuery.data ?? []).filter((appointment) => {
      const isUpcoming = appointment.status === 'scheduled' && new Date(appointment.start_time).getTime() >= now
      return tab === 'upcoming' ? isUpcoming : !isUpcoming
    })
    const term = search.trim().toLocaleLowerCase()
    const searched = term ? filtered.filter((appointment) => (
      appointment.doctor.name.toLocaleLowerCase().includes(term) ||
      appointment.doctor.specialty.toLocaleLowerCase().includes(term) ||
      appointment.reason_for_visit.toLocaleLowerCase().includes(term)
    )) : filtered
    return searched.sort((left, right) => {
      const difference = new Date(left.start_time).getTime() - new Date(right.start_time).getTime()
      return tab === 'upcoming' ? difference : -difference
    })
  }, [appointmentsQuery.data, search, tab])

  function requestCancellation(appointment: AppointmentWithDoctor) {
    cancelAppointment.mutate(appointment.id, {
      onSuccess: () => setCancelId(null),
    })
  }

  return (
    <PageLayout
      title="My Appointments"
      subtitle="View your upcoming visits and keep track of your appointment history."
      actions={<Link to="/book" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Book an appointment</Link>}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Appointment time period">
          {(['upcoming', 'past'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => { setTab(value); setCancelId(null) }}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${tab === value ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search appointments"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search doctor or reason"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>

      {appointmentsQuery.isLoading ? (
        <p role="status" className="rounded-lg bg-gray-50 p-6 text-sm text-gray-600">Loading your appointments…</p>
      ) : appointmentsQuery.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p role="alert">We couldn’t load your appointments: {appointmentsQuery.error.message}</p>
          <button type="button" onClick={() => void appointmentsQuery.refetch()} className="mt-3 font-semibold underline">Try again</button>
        </div>
      ) : appointments.length ? (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const canCancel = appointment.status === 'scheduled' && new Date(appointment.start_time).getTime() > Date.now()
            return (
              <article key={appointment.id} className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-brand-700">{appointment.doctor.specialty}</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">{appointment.doctor.name}</h2>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  {formatClinicDateTime(appointment.start_time)}
                </p>
                <div className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                  <p><span className="font-medium text-gray-700">Reason:</span> <span className="text-gray-600">{appointment.reason_for_visit}</span></p>
                  {appointment.patient_phone && <p><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-600">{appointment.patient_phone}</span></p>}
                </div>
                {canCancel && (
                  <div className="mt-5 border-t pt-4">
                    {cancelId === appointment.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-4">
                        <p className="text-sm text-amber-900">Cancel this appointment? This action cannot be undone.</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setCancelId(null)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700">Keep appointment</button>
                          <button type="button" onClick={() => requestCancellation(appointment)} disabled={cancelAppointment.isPending} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                            {cancelAppointment.isPending ? 'Cancelling…' : 'Confirm cancellation'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setCancelId(appointment.id); cancelAppointment.reset() }} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Cancel appointment</button>
                    )}
                    {cancelAppointment.error && cancelId === appointment.id && <p role="alert" className="mt-3 text-sm text-red-700">{cancelAppointment.error.message}</p>}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-white px-6 py-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {search.trim() ? 'No matching appointments' : tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {search.trim() ? 'Try a different search term.' : tab === 'upcoming' ? 'When you book a visit, it will appear here.' : 'Your completed and cancelled visits will appear here.'}
          </p>
          {!search.trim() && tab === 'upcoming' && <Link to="/book" className="mt-5 inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Find a specialist</Link>}
        </div>
      )}
    </PageLayout>
  )
}
