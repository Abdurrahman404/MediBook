import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { BookingPage } from '@/pages/BookingPage'
import { PatientDashboard } from '@/pages/PatientDashboard'
import { addDaysToDateKey, formatClinicDateTime, getClinicDate } from '@/lib/utils'

const hooks = vi.hoisted(() => ({
  doctors: { data: [] as unknown[], isLoading: false, error: null, refetch: vi.fn() },
  slots: { data: [] as unknown[], isLoading: false, error: null, refetch: vi.fn() },
  booking: { mutate: vi.fn(), isPending: false, error: null },
  appointments: { data: [] as unknown[], isLoading: false, error: null, refetch: vi.fn() },
  cancellation: { mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() },
  adminAppointments: { data: [] as unknown[], isLoading: false, error: null, refetch: vi.fn() },
  adminFilters: [] as unknown[],
  stats: { data: { total: 1, today: 1, cancelled: 0, completed: 0 }, isLoading: false, error: null, refetch: vi.fn() },
  updateStatus: { mutate: vi.fn(), isPending: false, error: null },
}))

vi.mock('@/hooks/useDoctors', () => ({ useDoctors: () => hooks.doctors }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ profile: null }) }))
vi.mock('@/hooks/useSlots', () => ({ useSlots: () => hooks.slots }))
vi.mock('@/hooks/useAppointments', () => ({
  useBookAppointment: () => hooks.booking,
  useAppointments: () => hooks.appointments,
  useCancelAppointment: () => hooks.cancellation,
}))
vi.mock('@/hooks/useAdminAppointments', () => ({
  useAdminAppointments: (filters: unknown) => {
    hooks.adminFilters.push(filters)
    return hooks.adminAppointments
  },
  useAdminStats: () => hooks.stats,
  useAdminUpdateStatus: () => hooks.updateStatus,
}))

const doctor = {
  id: 'doctor-1',
  profile_id: null,
  name: 'Dr. Test',
  specialty: 'Cardiology',
  bio: 'Experienced specialist.',
  consultation_fee: 120,
  created_at: '2026-10-19T00:00:00Z',
}
const slotDate = addDaysToDateKey(getClinicDate(), 1)
const slot = {
  id: 'slot-1',
  doctor_id: doctor.id,
  start_time: new Date(`${slotDate}T09:30:00+05:30`).toISOString(),
  end_time: new Date(`${slotDate}T10:00:00+05:30`).toISOString(),
  is_booked: false,
  created_at: '2026-10-19T00:00:00Z',
}
const appointment = {
  id: 'appointment-1',
  slot_id: slot.id,
  patient_id: 'patient-1',
  doctor_id: doctor.id,
  start_time: slot.start_time,
  end_time: slot.end_time,
  reason_for_visit: 'A routine heart checkup',
  patient_phone: '0771234567',
  status: 'scheduled' as const,
  created_at: '2026-10-19T00:00:00Z',
  updated_at: '2026-10-19T00:00:00Z',
  doctor: { name: doctor.name, specialty: doctor.specialty },
}
const pastAppointment = {
  ...appointment,
  id: 'appointment-past',
  start_time: '2020-01-01T04:00:00Z',
  status: 'cancelled' as const,
}
const adminAppointment = {
  ...appointment,
  patient: { full_name: 'Test Patient', email: 'patient@example.test', phone: null },
}

beforeEach(() => {
  hooks.doctors = { data: [doctor], isLoading: false, error: null, refetch: vi.fn() }
  hooks.slots = { data: [slot], isLoading: false, error: null, refetch: vi.fn() }
  hooks.booking = { mutate: vi.fn(), isPending: false, error: null }
  hooks.appointments = { data: [appointment, pastAppointment], isLoading: false, error: null, refetch: vi.fn() }
  hooks.cancellation = { mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() }
  hooks.adminAppointments = { data: [adminAppointment], isLoading: false, error: null, refetch: vi.fn() }
  hooks.adminFilters = []
  hooks.stats = { data: { total: 1, today: 1, cancelled: 0, completed: 0 }, isLoading: false, error: null, refetch: vi.fn() }
  hooks.updateStatus = { mutate: vi.fn(), isPending: false, error: null }
})

describe('Appointment workflows', () => {
  it('selects a specialist and time, then submits validated booking details', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><BookingPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'View available times' }))
    await user.click(screen.getByRole('button', { name: formatClinicDateTime(slot.start_time) }))
    await user.type(screen.getByLabelText('Reason for visit'), 'A routine heart checkup')
    await user.click(screen.getByRole('button', { name: 'Confirm appointment' }))

    expect(hooks.booking.mutate).toHaveBeenCalledWith(
      { slotId: slot.id, values: { reason_for_visit: 'A routine heart checkup', patient_phone: '' } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('switches between upcoming and past visits and confirms cancellation', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><PatientDashboard /></MemoryRouter>)
    expect(screen.getByText('Dr. Test')).toBeInTheDocument()
    expect(screen.queryByText('appointment-past')).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'past' }))
    expect(screen.getByText('Dr. Test')).toBeInTheDocument()
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'upcoming' }))
    await user.click(screen.getByRole('button', { name: 'Cancel appointment' }))
    await user.click(screen.getByRole('button', { name: 'Confirm cancellation' }))
    expect(hooks.cancellation.mutate).toHaveBeenCalledWith(appointment.id, expect.objectContaining({ onSuccess: expect.any(Function) }))
  })

  it('filters admin appointments and submits a status update', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AdminDashboard /></MemoryRouter>)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'completed')
    expect(hooks.adminFilters[hooks.adminFilters.length - 1]).toMatchObject({ status: 'completed' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Update status for Test Patient' }), 'no_show')
    expect(hooks.updateStatus.mutate).toHaveBeenCalledWith({ appointmentId: appointment.id, status: 'no_show' })
  })
})
