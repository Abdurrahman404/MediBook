import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { AppointmentWithDoctor, BookingFormValues } from '@/types'

/** Patient's own appointments with doctor info joined, split by upcoming/past. */
export function useAppointments() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['appointments', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppointmentWithDoctor[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors (name, specialty)
        `)
        .eq('patient_id', user!.id)
        .order('start_time', { ascending: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as AppointmentWithDoctor[]
    },
  })
}

/** Atomic booking mutation — calls the concurrency-safe Postgres RPC. */
export function useBookAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      slotId,
      values,
    }: {
      slotId: string
      values: BookingFormValues
    }) => {
      const { data, error } = await supabase.rpc('book_appointment', {
        p_slot_id: slotId,
        p_reason:  values.reason_for_visit,
        p_phone:   values.patient_phone || undefined,
      })

      if (error) {
        // Map DB error messages to user-friendly text
        if (error.message.includes('already been booked')) {
          throw new Error('This slot was just taken by another patient. Please choose a different time.')
        }
        if (error.message.includes('past')) {
          throw new Error('This slot is in the past and can no longer be booked.')
        }
        throw new Error(error.message)
      }

      if (!data) throw new Error('The appointment could not be confirmed. Please try again.')
      return data
    },
    onSuccess: (_data, { slotId }) => {
      // Invalidate both slots (so slot turns grey) and patient appointments
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      // Also remove the specific slot from cache so it disappears instantly
      queryClient.invalidateQueries({ queryKey: ['slots', slotId] })
    },
  })
}

/** Cancel a patient's own appointment via the cancel_appointment RPC. */
export function useCancelAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data, error } = await supabase.rpc('cancel_appointment', {
        p_appointment_id: appointmentId,
      })

      if (error) {
        if (error.message.includes('not found')) {
          throw new Error('Appointment not found or already cancelled.')
        }
        throw new Error(error.message)
      }

      if (!data) throw new Error('The appointment could not be cancelled. Please try again.')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}
