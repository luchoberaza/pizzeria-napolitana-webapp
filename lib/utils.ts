import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatQty(qty: number): string {
  if (qty === 0.5) return "½"
  const whole = Math.floor(qty)
  const half = qty - whole
  if (half >= 0.25 && half < 0.75) return `${whole}½`
  return String(qty)
}
