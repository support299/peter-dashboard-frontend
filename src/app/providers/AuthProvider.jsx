import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearAuth, getStoredUser, logoutRequest, restoreSession } from '../../lib'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(getStoredUser())
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const next = await restoreSession()
        if (!cancelled) setUser(next)
      } catch {
        clearAuth()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const loginSuccess = useCallback(() => {
    setUser(getStoredUser())
  }, [])

  const logout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      setShowChangePassword(false)
      setLoggingOut(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      authReady,
      user,
      isAuthenticated: Boolean(user),
      loggingOut,
      showChangePassword,
      setShowChangePassword,
      loginSuccess,
      logout,
    }),
    [authReady, user, loggingOut, showChangePassword, loginSuccess, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
