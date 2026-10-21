import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Doctor } from '@/types'

/** Fetch all doctors from the database. Results are cached for 5 minutes. */
export function useDoctors(specialty?: string) {
  return useQuery({
    queryKey: ['doctors', specialty ?? 'all'],
    queryFn: async (): Promise<Doctor[]> => {
      let query = supabase
        .from('doctors')
        .select('*')
        .order('name', { ascending: true })

      if (specialty && specialty !== 'all') {
        query = query.eq('specialty', specialty)
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)
      return data ?? []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/** Fetch all unique specialties (used to populate the filter bar). */
export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('doctors')
        .select('specialty')

      if (error) throw new Error(error.message)

      const unique = [...new Set((data ?? []).map((d) => d.specialty))].sort()
      return unique
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}
