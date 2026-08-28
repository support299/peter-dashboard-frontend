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

export function uniqueStrings(values = []) {
  return [...new Set(values.filter((value) => value != null && value !== ''))]
}

export function uniqueEmployees(employees = []) {
  const seen = new Set()
  return employees.filter((employee) => {
    if (!employee?.id || seen.has(employee.id)) return false
    seen.add(employee.id)
    return true
  })
}

export function uniqueDivisions(divisions = []) {
  const seen = new Set()
  return divisions.filter((item) => {
    const key = item?.key ?? item
    if (key == null || key === '' || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function looksLikePhone(value) {
  const text = String(value || '').trim()
  if (!text) return false
  const digits = [...text].filter((ch) => /\d/.test(ch)).length
  if (digits < 7) return false
  return [...text].every((ch) => /\d/.test(ch) || '+()- .'.includes(ch))
}

export function customerLabel(client) {
  const full = [client?.first_name, client?.last_name].filter(Boolean).join(' ').trim()
  if (full) return full
  const company = String(client?.company_name || client?.company || '').trim()
  if (company) return company
  const name = String(client?.name || '').trim()
  if (name && !looksLikePhone(name)) return name
  return 'Unnamed customer'
}

export { API }
