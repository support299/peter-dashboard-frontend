import { useEffect, useRef, useState } from 'react'

export function ProfileMenu({ user, loggingOut, onChangePassword, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const email = user?.email || user?.username || 'Account'
  const initial = String(email).trim().charAt(0).toUpperCase() || 'A'

  useEffect(() => {
    if (loggingOut) setOpen(true)
  }, [loggingOut])

  useEffect(() => {
    if (!open || loggingOut) return undefined
    function onDocClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, loggingOut])

  return (
    <div className={`profile-menu${open ? ' open' : ''}`} ref={rootRef}>
      <button
        className="profile-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={loggingOut}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="profile-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="profile-meta">
          <strong>Account</strong>
          <span>{email}</span>
        </span>
        <span className="profile-caret" aria-hidden="true" />
      </button>
      {open ? (
        <div className="profile-dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => {
              setOpen(false)
              onChangePassword()
            }}
          >
            Change password
          </button>
          <button
            type="button"
            role="menuitem"
            className={`danger${loggingOut ? ' loading' : ''}`}
            disabled={loggingOut}
            onClick={onLogout}
          >
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
