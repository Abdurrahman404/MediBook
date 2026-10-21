import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingForm } from '@/components/appointments/BookingForm'

const mutation = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
  error: null as Error | null,
}))

vi.mock('@/hooks/useAppointments', () => ({
  useBookAppointment: () => mutation,
}))

const slot = {
  id: 'slot-1',
  doctor_id: 'doctor-1',
  start_time: '2026-10-22T04:00:00.000Z',
  end_time: '2026-10-22T04:30:00.000Z',
  is_booked: false,
  created_at: '2026-10-19T00:00:00.000Z',
}

beforeEach(() => {
  mutation.mutate.mockReset()
  mutation.isPending = false
  mutation.error = null
})

describe('BookingForm', () => {
  it('renders the reason field and selected appointment details', () => {
    render(<BookingForm slot={slot} doctorName="Dr. Test" onBack={vi.fn()} onBooked={vi.fn()} />)
    expect(screen.getByLabelText('Reason for visit')).toBeInTheDocument()
    expect(screen.getByText(/Dr\. Test/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm appointment' })).toBeInTheDocument()
  })

  it('shows validation errors instead of submitting a short reason', async () => {
    const user = userEvent.setup()
    render(<BookingForm slot={slot} doctorName="Dr. Test" onBack={vi.fn()} onBooked={vi.fn()} />)
    await user.type(screen.getByLabelText('Reason for visit'), 'Short')
    await user.click(screen.getByRole('button', { name: 'Confirm appointment' }))
    expect(await screen.findByText('Please describe your reason for the visit (at least 10 characters)')).toBeInTheDocument()
    expect(mutation.mutate).not.toHaveBeenCalled()
  })

  it('disables submit while the booking request is pending', () => {
    mutation.isPending = true
    render(<BookingForm slot={slot} doctorName="Dr. Test" onBack={vi.fn()} onBooked={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Booking appointment…' })).toBeDisabled()
  })
})
