import type { Database, UserRole, AppointmentStatus } from '@/lib/database.types'

// ─── Re-export primitives ────────────────────────────────────────────────────
export type { UserRole, AppointmentStatus }

// ─── Row aliases (shorter names for component props) ─────────────────────────
export type Profile     = Database['public']['Tables']['profiles']['Row']
export type Doctor      = Database['public']['Tables']['doctors']['Row']
export type Slot        = Database['public']['Tables']['availability_slots']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']

// ─── Enriched types (joined queries) ─────────────────────────────────────────

/** Appointment with doctor info joined — used in Patient Dashboard */
export type AppointmentWithDoctor = Appointment & {
  doctor: Pick<Doctor, 'name' | 'specialty'>
}

/** Appointment with both doctor and patient info — used in Admin Dashboard */
export type AppointmentWithDetails = Appointment & {
  doctor:  Pick<Doctor,  'name' | 'specialty'>
  patient: Pick<Profile, 'full_name' | 'email' | 'phone'>
}

// ─── Form value types ─────────────────────────────────────────────────────────

/** Values collected by BookingForm */
export interface BookingFormValues {
  reason_for_visit: string
  patient_phone?:   string
}

/** Booking wizard step state */
export type BookingStep = 'select-doctor' | 'select-slot' | 'fill-form' | 'confirmed'

// ─── Filter types ─────────────────────────────────────────────────────────────

/** Admin dashboard filter state */
export interface AdminFilters {
  search:    string
  doctor_id: string | null
  status:    AppointmentStatus | 'all'
  date_from: string | null
  date_to:   string | null
}

/** Patient dashboard filter state */
export interface PatientFilters {
  tab:    'upcoming' | 'past'
  search: string
}

// ─── API error helper ─────────────────────────────────────────────────────────

/** Structured error returned from Supabase RPCs */
export interface SupabaseRpcError {
  message: string
  code?:   string
  details?: string
}
