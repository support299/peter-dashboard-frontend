import { useCallback, useState } from 'react'
import { api } from '../../lib'
import { useFetch, usePeriod } from '../master/periodState'
import { toast } from '../../lib/feedback'

/** Send JSON or FormData; errors keep the response payload (e.g. likely duplicates on 409). */
export async function send(path, { method = 'POST', body } = {}) {
  const options = { method }
  if (body !== undefined) options.body = body instanceof FormData ? body : JSON.stringify(body)
  const response = await api(path, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(payload.error || payload.message || 'Something went wrong')
    err.status = response.status
    err.payload = payload
    throw err
  }
  return payload
}

export function toForm(data, file) {
  const form = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })
  if (file) form.append('receipt', file)
  return form
}

/** Open a receipt in a new tab (the link from the API expires after a few minutes). */
export async function openReceipt(path) {
  // Open the tab first, inside the click, so popup blockers allow it.
  const tab = window.open('', '_blank')
  try {
    const { url } = await send(path, { method: 'GET' })
    if (tab) tab.location.href = url
    else window.location.href = url
  } catch (err) {
    tab?.close()
    toast(err.message, { type: 'error' })
  }
}

/** Download a file from an authenticated endpoint (CSV export). */
export async function download(path, filename) {
  const response = await api(path)
  if (!response.ok) throw new Error('Download failed')
  saveBlob(await response.blob(), filename)
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function csvBlob(rows) {
  const escape = (value) => {
    const text = value == null ? '' : String(value)
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return new Blob(['﻿' + rows.map((row) => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

/** Financials settings (role, categories, choices). Re-fetched after any change through the period `reload`. */
export function useMeta() {
  const { version } = usePeriod()
  return useFetch('/api/financials/meta/', version).data
}

export function useDrill() {
  const [drill, setDrill] = useState(null)
  const open = useCallback((metric, title, extra = {}) => setDrill({ metric, title, ...extra }), [])
  const close = useCallback(() => setDrill(null), [])
  return [drill, open, close]
}

export const ROLE_RANK = { '': 0, entry: 1, full: 2, admin: 3 }

export function atLeast(role, level) {
  return ROLE_RANK[role || ''] >= ROLE_RANK[level]
}

// Quebec sales taxes.
export const GST_RATE = 0.05
export const QST_RATE = 0.09975

export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function todayIso() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function monthIso(value = todayIso()) {
  return String(value).slice(0, 7)
}

export function subcategoriesOf(meta, categoryId) {
  return (meta?.categories || []).filter((c) => c.parent_id === Number(categoryId) && c.is_active)
}
