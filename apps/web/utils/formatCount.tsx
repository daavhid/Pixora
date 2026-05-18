/**
 * Converts a number to a compact human-readable string.
 * 1200 → "1.2K", 1_500_000 → "1.5M", etc.
 */
export const formatCount = (n: number): string => {
  if (!Number.isFinite(n)) return "0"

  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""

  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}B`
  if (abs >= 1_000_000)     return `${sign}${trim(abs / 1_000_000)}M`
  if (abs >= 1_000)         return `${sign}${trim(abs / 1_000)}K`

  return `${n}`
}

/**
 * Same as formatCount but always shows one decimal place.
 * 1200 → "1.2K" instead of potentially "1K"
 */
export const formatCountFixed = (n: number): string => {
  if (!Number.isFinite(n)) return "0"

  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""

  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(1)}K`

  return `${n}`
}

/**
 * Trims trailing zeroes after the decimal.
 * 1.0 → "1", 1.5 → "1.5", 1.50 → "1.5"
 */
const trim = (n: number): string =>
  parseFloat(n.toFixed(1)).toString()