const API = import.meta.env.VITE_API_BASE || ''

export async function readJson(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Something went wrong')
  }
  return payload
}

export function api(path) {
  return fetch(`${API}${path}`)
}

export function money(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  }).format(amount)
}

export function number(value) {
  return new Intl.NumberFormat('en-CA').format(Number(value || 0))
}

export function when(value, withTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

export function monthLabel(value) {
  const [year, month] = String(value).split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-CA', { month: 'short' })
}

export function relative(value) {
  if (!value) return ''
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days}d ago`
  return when(value)
}

export function queryString(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') params.set(key, val)
  })
  const text = params.toString()
  return text ? `?${text}` : ''
}

export { API }
