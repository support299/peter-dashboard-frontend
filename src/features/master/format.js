import { money, number } from '../../lib'

export function formatValue(kind, value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (kind === 'currency') return money(n)
  if (kind === 'percent') return `${n.toFixed(1)}%`
  if (kind === 'rate' || kind === 'decimal') return n.toFixed(2)
  return number(n)
}

/** "+$11,250 / +15.8%", or "+3.1 pts" for percentages. */
export function formatChange(kind, current, comparison) {
  if (current === null || current === undefined || comparison === null || comparison === undefined) return null
  const diff = Number(current) - Number(comparison)
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : ''
  const abs = Math.abs(diff)
  if (kind === 'percent') return { diff, text: `${sign}${abs.toFixed(1)} pts` }
  const amount = kind === 'currency' ? money(abs) : kind === 'rate' || kind === 'decimal' ? abs.toFixed(2) : number(abs)
  const base = Number(comparison)
  const pct = base !== 0 ? `${sign}${Math.abs((diff / Math.abs(base)) * 100).toFixed(1)}%` : null
  return { diff, text: pct ? `${sign}${amount} / ${pct}` : `${sign}${amount}` }
}

/** good | bad | flat, using the KPI's "better" direction. */
export function tone(better, diff) {
  if (!diff) return 'flat'
  return (diff > 0) === (better !== 'down') ? 'good' : 'bad'
}

export function shortDate(value) {
  if (!value) return '—'
  const [y, m, d] = String(value).split('-').map(Number)
  if (!y) return '—'
  const date = new Date(y, (m || 1) - 1, d || 1)
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function monthName(value) {
  if (!value) return '—'
  const [y, m] = String(value).split('-').map(Number)
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })
}
