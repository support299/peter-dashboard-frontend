import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

/** Requires authenticated session (HttpOnly cookie / restored user). */
export function ProtectedRoute() {
  const { authReady, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!authReady) {
    return <div className="content muted">Loading…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

/** Login (and future guest) pages — bounce away if already signed in. */
export function GuestRoute() {
  const { authReady, isAuthenticated } = useAuth()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/jobber/overview'

  if (!authReady) {
    return <div className="content muted">Loading…</div>
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
