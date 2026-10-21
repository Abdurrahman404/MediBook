import type { AppointmentStatus } from '@/types'

const statusStyles: Record<AppointmentStatus, string> = {
  scheduled: 'bg-emerald-100 text-emerald-900',
  completed: 'bg-green-100 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-amber-100 text-amber-900',
}

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  )
}
