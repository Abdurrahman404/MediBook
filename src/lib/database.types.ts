// =============================================================
// Supabase Database Types
// Generated manually to match the schema in supabase/migrations/
// Run `supabase gen types typescript` to auto-regenerate after schema changes.
// =============================================================

export type UserRole = 'patient' | 'doctor' | 'admin'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: UserRole
          phone?: string | null
          created_at?: string
        }
        Update: {
          email?: string
          full_name?: string
          role?: UserRole
          phone?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          id: string
          profile_id: string | null
          name: string
          specialty: string
          bio: string | null
          consultation_fee: number | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          name: string
          specialty: string
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
        }
        Update: {
          name?: string
          specialty?: string
          bio?: string | null
          consultation_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'doctors_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      availability_slots: {
        Row: {
          id: string
          doctor_id: string
          start_time: string
          end_time: string
          is_booked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          start_time: string
          end_time: string
          is_booked?: boolean
          created_at?: string
        }
        Update: {
          is_booked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'availability_slots_doctor_id_fkey'
            columns: ['doctor_id']
            isOneToOne: false
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          slot_id: string | null
          patient_id: string
          doctor_id: string
          start_time: string
          end_time: string
          reason_for_visit: string
          patient_phone: string | null
          status: AppointmentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slot_id?: string | null
          patient_id: string
          doctor_id: string
          start_time: string
          end_time: string
          reason_for_visit: string
          patient_phone?: string | null
          status?: AppointmentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: AppointmentStatus
          reason_for_visit?: string
          patient_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_slot_id_fkey'
            columns: ['slot_id']
            isOneToOne: false
            referencedRelation: 'availability_slots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_doctor_id_fkey'
            columns: ['doctor_id']
            isOneToOne: false
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      book_appointment: {
        Args: { p_slot_id: string; p_reason: string; p_phone?: string }
        Returns: Database['public']['Tables']['appointments']['Row']
      }
      cancel_appointment: {
        Args: { p_appointment_id: string }
        Returns: boolean
      }
      admin_update_appointment_status: {
        Args: { p_appointment_id: string; p_status: AppointmentStatus }
        Returns: boolean
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      appointment_status: AppointmentStatus
    }
    CompositeTypes: { [_ in never]: never }
  }
}
