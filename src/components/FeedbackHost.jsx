import { useEffect, useSyncExternalStore } from 'react'
import { closeDialog, dismissToast, getSnapshot, subscribe } from '../lib/feedback'
import '../styles/feedback.css'

const ICONS = { success: '✓', error: '!', info: 'i' }

function ConfirmDialog({ dialog }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') closeDialog(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="fb-backdrop" role="presentation" onClick={() => closeDialog(false)}>
      <div
        className="fb-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fb-dialog-title"
        aria-describedby={dialog.message ? 'fb-dialog-message' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`fb-dialog-icon ${dialog.danger ? 'danger' : ''}`} aria-hidden="true">
          {dialog.danger ? '!' : '?'}
        </div>
        <div className="fb-dialog-body">
          <h3 id="fb-dialog-title">{dialog.title}</h3>
          {dialog.message ? <p id="fb-dialog-message">{dialog.message}</p> : null}
        </div>
        <div className="fb-dialog-actions">
          {/* Dangerous actions start on Cancel, so a stray Enter doesn't delete anything. */}
          <button type="button" className="ghost" onClick={() => closeDialog(false)} autoFocus={dialog.danger}>
            {dialog.cancelLabel}
          </button>
          <button type="button" className={dialog.danger ? 'fb-danger' : 'primary'} onClick={() => closeDialog(true)} autoFocus={!dialog.danger}>
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Mounted once in App: draws confirmDialog() and toast() from lib/feedback. */
export function FeedbackHost() {
  const { toasts, dialog } = useSyncExternalStore(subscribe, getSnapshot)
  return (
    <>
      {dialog ? <ConfirmDialog key={dialog.title + dialog.message} dialog={dialog} /> : null}
      <div className="fb-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`fb-toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <span className="fb-toast-icon" aria-hidden="true">
              {ICONS[t.type] || ICONS.info}
            </span>
            <span className="fb-toast-text">{t.message}</span>
            <button type="button" className="fb-toast-close" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
