import { z } from 'zod'
import { sriLankanMobileSchema } from './phoneSchema'

/** Zod schema for the patient registration form */
export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),
  phone: sriLankanMobileSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirm_password: z.string(),
}).refine(
  (data) => data.password === data.confirm_password,
  { message: 'Passwords do not match', path: ['confirm_password'] }
)

export type RegisterFormValues = z.infer<typeof registerSchema>

/** Zod schema for the login form */
export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

/** Zod schema for the appointment booking form */
export const bookingSchema = z.object({
  reason_for_visit: z
    .string()
    .min(10, 'Please describe your reason for the visit (at least 10 characters)')
    .max(500, 'Reason is too long (max 500 characters)'),
  patient_phone: sriLankanMobileSchema,
})

export type BookingFormValues = z.infer<typeof bookingSchema>
