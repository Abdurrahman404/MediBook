import { describe, expect, it } from 'vitest'
import { bookingSchema, loginSchema, registerSchema } from '@/schemas/bookingSchema'

const registration = {
  full_name: 'Test Patient',
  email: 'patient@example.com',
  password: 'Password1',
  confirm_password: 'Password1',
}

describe('Phase 1 validation', () => {
  it('accepts valid registration details', () => {
    expect(registerSchema.safeParse(registration).success).toBe(true)
  })

  it('rejects passwords under eight characters', () => {
    expect(registerSchema.safeParse({ ...registration, password: 'Short1', confirm_password: 'Short1' }).success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    expect(registerSchema.safeParse({ ...registration, confirm_password: 'Different1' }).success).toBe(false)
  })

  it('rejects an empty login email', () => {
    expect(loginSchema.safeParse({ email: '', password: 'Password1' }).success).toBe(false)
  })

  it('rejects short booking reasons', () => {
    expect(bookingSchema.safeParse({ reason_for_visit: 'Short' }).success).toBe(false)
  })

  it.each(['1234567890', '98765', '987654321a'])('rejects the malformed mobile number %s', (patient_phone) => {
    expect(bookingSchema.safeParse({ reason_for_visit: 'A routine consultation', patient_phone }).success).toBe(false)
  })
})

describe('Sri Lankan mobile numbers in registration and booking', () => {
  it.each([
    '0771234567', '0711234567', '0701234567', '0781234567',
    '077 123 4567', '077-123-4567', '(077) 123 4567',
    '+94771234567', '+94 77 123 4567', '94771234567', '0094771234567',
  ])('accepts and normalizes %s', (phone) => {
    const local = phone.includes('071') ? '0711234567'
      : phone.includes('070') ? '0701234567'
      : phone.includes('078') ? '0781234567' : '0771234567'
    expect(registerSchema.parse({ ...registration, phone }).phone).toBe(local)
    expect(bookingSchema.parse({ reason_for_visit: 'A routine consultation', patient_phone: phone }).patient_phone).toBe(local)
  })

  it.each(['9876543210', '+919876543210', '0111234567', '077123456', '07712345678', '+940771234567', '0771234abc'])('rejects non-mobile or malformed number %s', (phone) => {
    expect(registerSchema.safeParse({ ...registration, phone }).success).toBe(false)
    expect(bookingSchema.safeParse({ reason_for_visit: 'A routine consultation', patient_phone: phone }).success).toBe(false)
  })

  it('keeps phone optional and accepts blank whitespace', () => {
    expect(registerSchema.parse({ ...registration, phone: '   ' }).phone).toBe('')
    expect(bookingSchema.parse({ reason_for_visit: 'A routine consultation' }).patient_phone).toBeUndefined()
  })
})
