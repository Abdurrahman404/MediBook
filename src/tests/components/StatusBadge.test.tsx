import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/appointments/StatusBadge'

describe('StatusBadge', () => {
  it('renders scheduled status with green styling', () => {
    render(<StatusBadge status="scheduled" />)
    expect(screen.getByText('Scheduled')).toHaveClass('bg-emerald-100')
  })

  it('renders cancelled status with red styling', () => {
    render(<StatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelled')).toHaveClass('bg-red-100')
  })

  it('renders completed status with green styling', () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toHaveClass('bg-green-100')
  })

  it('labels no-show appointments clearly', () => {
    render(<StatusBadge status="no_show" />)
    expect(screen.getByText('No-show')).toBeInTheDocument()
  })
})
