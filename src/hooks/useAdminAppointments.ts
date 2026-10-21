import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getClinicDate } from '@/lib/utils'
import type { AdminFilters, AppointmentWithDetails, AppointmentStatus } from '@/types'

/** Fetch ALL appointments with doctor and patient info joined — admin only. */
export function useAdminAppointments(filters: AdminFilters) {
  return useQuery({
    queryKey: ['admin-appointments', filters],
    queryFn: async (): Promise<AppointmentWithDetails[]> => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors  (name, specialty),
          patient:profiles (full_name, email, phone)
        `)
        .order('start_time', { ascending: false })

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id)
      }

      if (filters.date_from) {
        query = query.gte('start_time', new Date(`${filters.date_from}T00:00:00+05:30`).toISOString())
      }

      if (filters.date_to) {
        query = query.lte('start_time', new Date(`${filters.date_to}T23:59:59.999+05:30`).toISOString())
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)

      // Client-side search by patient name (Supabase free tier lacks FTS on joined tables)
      let result = (data ?? []) as AppointmentWithDetails[]
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase()
        result = result.filter(
          (a) =>
            a.patient.full_name.toLowerCase().includes(term) ||
            a.patient.email.toLowerCase().includes(term) ||
            a.doctor.name.toLowerCase().includes(term)
        )
      }

      return result
    },
  })
}

/** Admin status update via the admin_update_appointment_status RPC. */
export function useAdminUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
    }: {
      appointmentId: string
      status: AppointmentStatus
    }) => {
      const { data, error } = await supabase.rpc('admin_update_appointment_status', {
        p_appointment_id: appointmentId,
        p_status:         status,
      })

      if (error) throw new Error(error.message)
      if (!data) throw new Error('The appointment status could not be updated. Please try again.')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

/** Aggregate stats for the admin stats bar. */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const clinicDate = getClinicDate()
      const today = new Date(`${clinicDate}T00:00:00+05:30`)
      const todayEnd = new Date(`${clinicDate}T23:59:59.999+05:30`)

      const [total, todayCount, cancelled, completed] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .gte('start_time', today.toISOString()).lte('start_time', todayEnd.toISOString()),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'cancelled'),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
      ])

      const failure = [total, todayCount, cancelled, completed].find((result) => result.error)
      if (failure?.error) throw new Error(failure.error.message)

      return {
        total: total.count ?? 0,
        today: todayCount.count ?? 0,
        cancelled: cancelled.count ?? 0,
        completed: completed.count ?? 0,
      }
    },
    staleTime: 60_000, // 1 minute
  })
}
