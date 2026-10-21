import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Stethoscope } from 'lucide-react'
import { BookingForm } from '@/components/appointments/BookingForm'
import { StatusBadge } from '@/components/appointments/StatusBadge'
import { PageLayout } from '@/components/layout/PageLayout'
import { useDoctors } from '@/hooks/useDoctors'
import { useSlots } from '@/hooks/useSlots'
import { addDaysToDateKey, formatClinicDateTime, getClinicDate } from '@/lib/utils'
import type { Appointment, Doctor, Slot } from '@/types'

export function BookingPage() {
  const doctorsQuery = useDoctors()
  const [specialty, setSpecialty] = useState('all')
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [date, setDate] = useState(() => addDaysToDateKey(getClinicDate(), 1))
  const [slot, setSlot] = useState<Slot | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const slotsQuery = useSlots(doctor?.id ?? null, doctor ? date : null)

  const specialties = useMemo(
    () => [...new Set((doctorsQuery.data ?? []).map((item) => item.specialty))].sort(),
    [doctorsQuery.data],
  )
  const doctors = useMemo(
    () => (doctorsQuery.data ?? []).filter((item) => specialty === 'all' || item.specialty === specialty),
    [doctorsQuery.data, specialty],
  )

  function resetBooking() {
    setAppointment(null)
    setDoctor(null)
    setSlot(null)
  }

  return (
    <PageLayout
      title="Book an Appointment"
      subtitle="Choose a specialist, pick an available time, and confirm your visit."
    >
      {appointment ? (
        <section className="mx-auto max-w-2xl rounded-xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Appointment confirmed</h2>
          <p className="mt-2 text-gray-600">Your appointment has been booked successfully.</p>
          <div className="my-6 rounded-lg bg-gray-50 p-5 text-left">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900">{doctor?.name}</h3>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatClinicDateTime(appointment.start_time)}
            </p>
            <p className="mt-3 text-sm text-gray-700"><span className="font-medium">Reference:</span> {appointment.id}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/dashboard" className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">My appointments</Link>
            <button type="button" onClick={resetBooking} className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50">Book another</button>
          </div>
        </section>
      ) : slot && doctor ? (
        <BookingForm
          slot={slot}
          doctorName={doctor.name}
          onBack={() => setSlot(null)}
          onBooked={setAppointment}
        />
      ) : doctor ? (
        <section className="space-y-6">
          <button type="button" onClick={() => setDoctor(null)} className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Choose another specialist
          </button>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-700">{doctor.specialty}</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900">{doctor.name}</h2>
                {doctor.bio && <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{doctor.bio}</p>}
                {doctor.consultation_fee !== null && (
                  <p className="mt-3 text-sm font-medium text-gray-700">Consultation fee: {doctor.consultation_fee.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Appointment date
                <input
                  aria-label="Appointment date"
                  type="date"
                  min={getClinicDate()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Available times</h2>
            </div>
            {slotsQuery.isLoading ? (
              <p role="status" className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600">Loading available times…</p>
            ) : slotsQuery.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p role="alert">We couldn’t load available times: {slotsQuery.error.message}</p>
                <button type="button" onClick={() => void slotsQuery.refetch()} className="mt-3 font-semibold underline">Try again</button>
              </div>
            ) : slotsQuery.data?.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {slotsQuery.data.map((availableSlot) => (
                  <button
                    key={availableSlot.id}
                    type="button"
                    onClick={() => setSlot(availableSlot)}
                    className="rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-800 hover:border-brand-500 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    {formatClinicDateTime(availableSlot.start_time)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600">No appointments are available on this date. Choose another date to see more times.</p>
            )}
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Choose a specialist</h2>
            {specialties.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                Specialty
                <select value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2">
                  <option value="all">All specialties</option>
                  {specialties.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )}
          </div>
          {doctorsQuery.isLoading ? (
            <p role="status" className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600">Loading specialists…</p>
          ) : doctorsQuery.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p role="alert">We couldn’t load specialists: {doctorsQuery.error.message}</p>
              <button type="button" onClick={() => void doctorsQuery.refetch()} className="mt-3 font-semibold underline">Try again</button>
            </div>
          ) : doctors.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((item) => (
                <article key={item.id} className="flex flex-col rounded-xl border bg-white p-5 shadow-sm">
                  <Stethoscope className="h-8 w-8 text-brand-600" aria-hidden="true" />
                  <p className="mt-4 text-sm font-medium text-brand-700">{item.specialty}</p>
                  <h3 className="mt-1 text-lg font-bold text-gray-900">{item.name}</h3>
                  {item.bio && <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">{item.bio}</p>}
                  {item.consultation_fee !== null && <p className="mt-4 text-sm font-semibold text-gray-800">{item.consultation_fee.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</p>}
                  <button type="button" onClick={() => setDoctor(item)} className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">View available times</button>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600">No specialists are available at the moment. Please check again later.</p>
          )}
        </section>
      )}
    </PageLayout>
  )
}
