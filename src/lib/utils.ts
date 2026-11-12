import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Threshold representing a neutral zero ELO delta. */
const ZERO_ELO_DELTA = 0

/** Locale identifier used for French date and number formatting. */
const FRENCH_LOCALE = 'fr-FR'

/**
 * Merges conditional class names and resolves Tailwind CSS conflicts.
 *
 * @param {...ClassValue[]} classInputs - Class values to combine and deduplicate.
 * @returns {string} Merged class name string.
 */
export function cn(...classInputs: ClassValue[]): string {
  return twMerge(clsx(classInputs))
}

/**
 * Formats an ELO rating number according to French locale conventions.
 *
 * @param {number} eloRating - The ELO rating value to format.
 * @returns {string} Formatted ELO string.
 */
export function formatElo(eloRating: number): string {
  return eloRating.toLocaleString(FRENCH_LOCALE)
}

/**
 * Formats an ISO date string into a concise human-readable French date and time.
 *
 * @param {string} isoDateString - The ISO 8601 date string to format.
 * @returns {string} Formatted date and time string.
 */
export function formatDate(isoDateString: string): string {
  return new Intl.DateTimeFormat(FRENCH_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDateString))
}

/**
 * Returns the Tailwind CSS text color class corresponding to an ELO rating delta.
 *
 * @param {number} eloDelta - The positive, negative, or zero ELO change.
 * @returns {string} Tailwind text color utility class.
 */
export function eloDeltaColor(eloDelta: number): string {
  if (eloDelta > ZERO_ELO_DELTA) return 'text-emerald-400'
  if (eloDelta < ZERO_ELO_DELTA) return 'text-rose-400'
  return 'text-slate-400'
}

/**
 * Formats an ELO rating delta with an explicit plus sign for positive values.
 *
 * @param {number} eloDelta - The positive, negative, or zero ELO change.
 * @returns {string} Signed ELO delta string.
 */
export function eloDeltaLabel(eloDelta: number): string {
  if (eloDelta > ZERO_ELO_DELTA) return `+${eloDelta}`
  return `${eloDelta}`
}
