import { z } from 'zod'

/** Store Sri Lankan mobiles in their familiar local 07XXXXXXXX format. */
export const sriLankanMobileSchema = z.string().trim().transform((value) => {
  const compact = value.replace(/[\s()-]/g, '')
  if (compact.startsWith('+94')) return `0${compact.slice(3)}`
  if (compact.startsWith('0094')) return `0${compact.slice(4)}`
  if (compact.startsWith('94')) return `0${compact.slice(2)}`
  return compact
}).refine(
  (value) => value === '' || /^07\d{8}$/.test(value),
  'Enter a Sri Lankan mobile number, such as 0771234567 or +94771234567',
).optional()
