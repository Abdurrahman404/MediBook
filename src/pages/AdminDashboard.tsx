import { useState } from 'react'
import { CalendarDays, CheckCircle2, ClipboardList, XCircle } from 'lucide-react'
import { StatusBadge } from '@/components/appointments/StatusBadge'
import { PageLayout } from '@/components/layout/PageLayout'
import { useAdminAppointments, useAdminStats, useAdminUpdateStatus } from '@/hooks/useAdminAppointments'
import { useDoctors } from '@/hooks/useDoctors'
import { formatClinicDateTime } from '@/lib/utils'
import type { AdminFilters, AppointmentStatus } from '@/types'

const initialFilters: AdminFilters = {
  search: '',
  doctor_id: null,
  status: 'all',
  date_from: null,
  date_to: null,
}

const statCards = [
  { key: 'total', label: 'All appointments', icon: ClipboardList, color: 'text-brand-700 bg-brand-50' },
  { key: 'today', label: 'Today', icon: CalendarDays, color: 'text-violet-700 bg-violet-50' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-700 bg-green-50' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-700 bg-red-50' },
] as const

export function AdminDashboard() {
  const [filters, setFilters] = useState<AdminFilters>(initialFilters)
  const appointmentsQuery = useAdminAppointments(filters)
  const statsQuery = useAdminStats()
  const doctorsQuery = useDoctors()
  const updateStatus = useAdminUpdateStatus()

  function changeFilter<Key extends keyof AdminFilters>(key: Key, value: AdminFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <PageLayout title="Admin Dashboard" subtitle="Review appointments, update visit outcomes, and monitor clinic activity.">
      <section aria-label="Appointment statistics" className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <article key={key} className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className={`rounded-lg p-3 ${color}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              {statsQuery.isLoading ? <p role="status" className="mt-1 text-xl font-bold text-gray-400">…</p> :
                statsQuery.error ? <p className="mt-1 text-xl font-bold text-red-600">—</p> :
                  <p className="mt-1 text-2xl font-bold text-gray-900">{statsQuery.data?.[key] ?? 0}</p>}
            </div>
          </article>
        ))}
      </section>

      {statsQuery.error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p role="alert">We couldn’t load appointment statistics: {statsQuery.error.message}</p>
          <button type="button" onClick={() => void statsQuery.refetch()} className="mt-2 font-semibold underline">Try again</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Appointments</h2>
            <p className="mt-1 text-sm text-gray-500">Search and filter visits, then update scheduled appointments.</p>
          </div>
          {doctorsQuery.error && (
            <p role="alert" className="mt-3 text-sm text-red-700">Doctor filters could not be loaded: {doctorsQuery.error.message}</p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="sm:col-span-2 lg:col-span-1">
              <span className="sr-only">Search appointments</span>
              <input
                type="search"
                aria-label="Search appointments"
                value={filters.search}
                onChange={(event) => changeFilter('search', event.target.value)}
                placeholder="Patient, email, or doctor"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label>
              <span className="sr-only">Filter by doctor</span>
              <select aria-label="Filter by doctor" value={filters.doctor_id ?? ''} onChange={(event) => changeFilter('doctor_id', event.target.value || null)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">All doctors</option>
                {(doctorsQuery.data ?? []).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select aria-label="Filter by status" value={filters.status} onChange={(event) => changeFilter('status', event.target.value as AppointmentStatus | 'all')} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No-show</option>
              </select>
            </label>
            <label>
              <span className="sr-only">From date</span>
              <input aria-label="From date" type="date" value={filters.date_from ?? ''} max={filters.date_to ?? undefined} onChange={(event) => changeFilter('date_from', event.target.value || null)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="sr-only">To date</span>
              <input aria-label="To date" type="date" value={filters.date_to ?? ''} min={filters.date_from ?? undefined} onChange={(event) => changeFilter('date_to', event.target.value || null)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        {updateStatus.error && <p role="alert" className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{updateStatus.error.message}</p>}
        {appointmentsQuery.isLoading ? (
          <p role="status" className="p-8 text-center text-sm text-gray-600">Loading appointments…</p>
        ) : appointmentsQuery.error ? (
          <div className="p-6 text-sm text-red-700">
            <p role="alert">We couldn’t load appointments: {appointmentsQuery.error.message}</p>
            <button type="button" onClick={() => void appointmentsQuery.refetch()} className="mt-3 font-semibold underline">Try again</button>
          </div>
        ) : appointmentsQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Patient</th>
                  <th scope="col" className="px-5 py-3">Doctor</th>
                  <th scope="col" className="px-5 py-3">Appointment</th>
                  <th scope="col" className="px-5 py-3">Reason</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointmentsQuery.data.map((appointment) => (
                  <tr key={appointment.id} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{appointment.patient.full_name}</p>
                      <p className="mt-1 text-gray-500">{appointment.patient.email}</p>
                      {(appointment.patient_phone || appointment.patient.phone) && <p className="mt-1 text-gray-500">{appointment.patient_phone || appointment.patient.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{appointment.doctor.name}</p>
                      <p className="mt-1 text-gray-500">{appointment.doctor.specialty}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">{formatClinicDateTime(appointment.start_time)}</td>
                    <td className="max-w-xs px-5 py-4 text-gray-600">{appointment.reason_for_visit}</td>
                    <td className="px-5 py-4"><StatusBadge status={appointment.status} /></td>
                    <td className="px-5 py-4">
                      {appointment.status === 'scheduled' && (
                        <select
                          aria-label={`Update status for ${appointment.patient.full_name}`}
                          defaultValue=""
                          disabled={updateStatus.isPending}
                          onChange={(event) => {
                            const status = event.target.value as AppointmentStatus
                            if (status) updateStatus.mutate({ appointmentId: appointment.id, status })
                          }}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs disabled:opacity-60"
                        >
                          <option value="" disabled>Update…</option>
                          <option value="completed">Mark completed</option>
                          <option value="no_show">Mark no-show</option>
                          <option value="cancelled">Cancel appointment</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-gray-600">No appointments match these filters.</p>
        )}
        {appointmentsQuery.data && (
          <p className="border-t bg-gray-50 px-5 py-3 text-xs text-gray-500">
            {appointmentsQuery.data.length} {appointmentsQuery.data.length === 1 ? 'appointment' : 'appointments'}
          </p>
        )}
      </section>
    </PageLayout>
  )
}
