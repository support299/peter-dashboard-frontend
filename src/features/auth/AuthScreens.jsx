import { useState } from 'react'
import {
  changePasswordRequest,
  forgotPasswordRequest,
  loginRequest,
  resetPasswordRequest,
} from '../../lib/auth'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c5 0 9.3 3.1 11 7-.5 1.2-1.3 2.4-2.3 3.4" />
        <path d="M6.1 6.1C4.2 7.4 2.7 9.2 1 12c1.7 3.9 6 7 11 7a10.8 10.8 0 0 0 5-1.2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  )
}

export function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await loginRequest(email, password)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <div className="mark">P</div>
          <div>
            <h1>Peter</h1>
            <p>Sign in to the operations dashboard</p>
          </div>
        </div>
        {error ? <div className="notice">{error}</div> : null}
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button className="primary auth-submit" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [debugUrl, setDebugUrl] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    setDebugUrl('')
    try {
      const payload = await forgotPasswordRequest(email)
      setMessage(payload.message || 'Check your email for a reset link.')
      if (payload.debug_reset_url) setDebugUrl(payload.debug_reset_url)
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <div className="mark">P</div>
          <div>
            <h1>Forgot password</h1>
            <p>We’ll email a reset link if the account exists</p>
          </div>
        </div>
        {error ? <div className="notice">{error}</div> : null}
        {message ? <div className="notice good">{message}</div> : null}
        {debugUrl ? (
          <p className="hint">
            Dev reset link:{' '}
            <a href={debugUrl}>{debugUrl}</a>
          </p>
        ) : null}
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button className="primary auth-submit" type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
        <button className="auth-link" type="button" onClick={onBack}>
          Back to sign in
        </button>
      </form>
    </div>
  )
}

export function ResetPasswordScreen({ token, onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = await resetPasswordRequest(token, password)
      setMessage(payload.message || 'Password updated.')
      setTimeout(() => onDone?.(), 1200)
    } catch (err) {
      setError(err.message || 'Could not reset password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <div className="mark">P</div>
          <div>
            <h1>Choose a new password</h1>
            <p>Use at least 8 characters</p>
          </div>
        </div>
        {error ? <div className="notice">{error}</div> : null}
        {message ? <div className="notice good">{message}</div> : null}
        <PasswordField
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <button className="primary auth-submit" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </div>
  )
}

export function ChangePasswordModal({ onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await changePasswordRequest(currentPassword, newPassword)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(err.message || 'Could not change password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="auth-card auth-modal"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-brand">
          <div>
            <h1>Change password</h1>
            <p>Enter your current password, then choose a new one</p>
          </div>
        </div>
        {error ? <div className="notice">{error}</div> : null}
        <PasswordField
          label="Old password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <div className="auth-modal-actions">
          <button className="ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}
