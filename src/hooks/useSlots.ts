import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Slot } from '@/types'

/**
 * Fetch available (non-booked, future) slots for a given doctor on a specific date.
 * Re-fetches whenever doctorId or date changes.
 */
export function useSlots(doctorId: string | null, date: string | null) {
  return useQuery({
    queryKey: ['slots', doctorId, date],
    enabled: !!doctorId && !!date,
    queryFn: async (): Promise<Slot[]> => {
      if (!doctorId || !date) return []

      // Availability dates are defined in Sri Lanka's clinic timezone.
      const startOfDay = new Date(`${date}T00:00:00+05:30`)
      const endOfDay = new Date(`${date}T23:59:59.999+05:30`)

      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_booked', false)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .gt('start_time', new Date().toISOString()) // exclude past slots
        .order('start_time', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
    staleTime: 30_000, // 30 seconds — short because slot availability changes frequently
  })
}
