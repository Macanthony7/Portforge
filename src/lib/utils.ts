import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CareerTrack } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TRACK_LABELS: Record<CareerTrack, string> = {
  cybersecurity: 'Cybersecurity',
}

export const TRACK_ICONS: Record<CareerTrack, string> = {
  cybersecurity: '🔐',
}

export const TRACK_COLORS: Record<CareerTrack, { bg: string; text: string; border: string }> = {
  cybersecurity: { bg: 'bg-red-950/30', text: 'text-red-400', border: 'border-red-900/40' },
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(date))
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function generateUsername(fullName: string): string {
  return slugify(fullName)
}
