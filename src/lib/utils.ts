import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatElo(elo: number): string {
  return elo.toLocaleString('fr-FR')
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export function eloDeltaColor(delta: number): string {
  if (delta > 0) return 'text-green-400'
  if (delta < 0) return 'text-red-400'
  return 'text-gray-400'
}

export function eloDeltaLabel(delta: number): string {
  if (delta > 0) return `+${delta}`
  return `${delta}`
}
