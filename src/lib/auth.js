const API = import.meta.env.VITE_API_BASE || ''

const USER_KEY = 'peter_auth_user'

// Soft client hint only — real tokens live in HttpOnly cookies.
let sessionHint = Boolean(localStorage.getItem(USER_KEY))
let refreshPromise = null

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

function rememberUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    sessionHint = true
  }
}

export function clearAuth() {
  sessionHint = false
  localStorage.removeItem(USER_KEY)
  // Legacy token storage from earlier builds
  sessionStorage.removeItem('peter_access_token')
  localStorage.removeItem('peter_refresh_token')
}

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Something went wrong')
  }
  return payload
}

const credentialOpts = { credentials: 'include' }

export async function loginRequest(email, password) {
  const payload = await parseJson(
    await fetch(`${API}/api/accounts/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...credentialOpts,
      body: JSON.stringify({ email, password }),
    }),
  )
  rememberUser(payload.user)
  return payload
}

export async function logoutRequest() {
  try {
    await fetch(`${API}/api/accounts/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...credentialOpts,
      body: '{}',
    })
  } finally {
    clearAuth()
  }
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API}/api/accounts/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...credentialOpts,
        body: '{}',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        clearAuth()
        throw new Error(payload.error || 'Session expired. Please sign in again.')
      }
      rememberUser(payload.user)
      return payload
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/** Authenticated fetch — cookies carry JWT; returns Response for readJson. */
export async function authFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response = await fetch(`${API}${path}`, {
    ...options,
    headers,
    ...credentialOpts,
  })

  if (response.status === 401 && !String(path).includes('/api/accounts/refresh/')) {
    try {
      await refreshAccessToken()
    } catch {
      return response
    }
    response = await fetch(`${API}${path}`, {
      ...options,
      headers,
      ...credentialOpts,
    })
  }

  return response
}

export async function authJson(path, options = {}) {
  return parseJson(await authFetch(path, options))
}

export async function fetchMe() {
  const payload = await authJson('/api/accounts/me/')
  rememberUser(payload.user)
  return payload.user
}

/** Try cookie session: /me, then silent refresh + /me. */
export async function restoreSession() {
  try {
    return await fetchMe()
  } catch {
    await refreshAccessToken()
    return fetchMe()
  }
}

export async function forgotPasswordRequest(email) {
  return parseJson(
    await fetch(`${API}/api/accounts/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...credentialOpts,
      body: JSON.stringify({ email }),
    }),
  )
}

export async function resetPasswordRequest(token, newPassword) {
  return parseJson(
    await fetch(`${API}/api/accounts/reset-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...credentialOpts,
      body: JSON.stringify({ token, new_password: newPassword }),
    }),
  )
}

export async function changePasswordRequest(currentPassword, newPassword) {
  const payload = await authJson('/api/accounts/change-password/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  rememberUser(payload.user)
  return payload
}

export function isLoggedIn() {
  return sessionHint
}

// Back-compat exports (tokens are cookie-only now)
export function getAccessToken() {
  return ''
}
