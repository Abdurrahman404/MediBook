import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { AuthInput } from '@/components/auth/AuthInput'
import { useBookAppointment } from '@/hooks/useAppointments'
import { bookingSchema, type BookingFormValues } from '@/schemas/bookingSchema'
import type { Slot, Appointment } from '@/types'
import { formatClinicDateTime } from '@/lib/utils'

interface BookingFormProps {
  slot: Slot
  doctorName: string
  onBack: () => void
  onBooked: (appointment: Appointment) => void
}

export function BookingForm({ slot, doctorName, onBack, onBooked }: BookingFormProps) {
  const booking = useBookAppointment()
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { patient_phone: '' },
  })

  function submit(values: BookingFormValues) {
    booking.mutate({ slotId: slot.id, values }, { onSuccess: onBooked })
  }

  return (
    <section className="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Choose another time
      </button>
      <h2 className="text-xl font-bold text-gray-900">Confirm your appointment</h2>
      <p className="mt-1 text-sm text-gray-600">{doctorName} · {formatClinicDateTime(slot.start_time)}</p>

      <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="reason_for_visit" className="block text-sm font-medium text-gray-800">Reason for visit</label>
          <textarea
            id="reason_for_visit"
            rows={4}
            maxLength={500}
            placeholder="Briefly describe what you would like the doctor to help with"
            aria-invalid={errors.reason_for_visit ? true : undefined}
            aria-describedby={errors.reason_for_visit ? 'reason_for_visit-error' : undefined}
            className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${errors.reason_for_visit ? 'border-red-500' : 'border-gray-300'}`}
            {...register('reason_for_visit')}
          />
          {errors.reason_for_visit && <p id="reason_for_visit-error" className="text-sm text-red-600">{errors.reason_for_visit.message}</p>}
        </div>
        <AuthInput
          id="patient_phone"
          label="Mobile number (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="077 123 4567"
          hint="Sri Lankan mobile number, for example 0771234567 or +94771234567."
          error={errors.patient_phone?.message}
          {...register('patient_phone')}
        />
        {booking.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{booking.error.message}</p>}
        <button type="submit" disabled={booking.isPending} className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
          {booking.isPending ? 'Booking appointment…' : 'Confirm appointment'}
        </button>
      </form>
    </section>
  )
}
