import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes without conflicts.
 * Use this everywhere instead of template literal class concatenation.
 *
 * @example cn('px-4 py-2', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string or Date object into a human-readable locale string.
 * @example formatDate('2026-10-18T09:00:00Z') → "18 Oct 2026, 9:00 AM"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format only the time portion of a date.
 * @example formatTime('2026-10-18T09:00:00Z') → "9:00 AM"
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format only the date portion (no time).
 * @example formatDateOnly('2026-10-18T09:00:00Z') → "Sun, 18 Oct 2026"
 */
export function formatDateOnly(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Return a YYYY-MM-DD date in the clinic's Sri Lankan timezone. */
export function getClinicDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatClinicDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-LK', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Returns true if the given date is strictly in the past.
 */
export function isPast(date: string | Date): boolean {
  return new Date(date) < new Date()
}

/**
 * Capitalize the first letter of each word.
 */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}
