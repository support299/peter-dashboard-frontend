/*
 * In-app confirmations and toasts, replacing the browser's confirm() and alert() pop-ups.
 * Call them from anywhere; <FeedbackHost /> (mounted once in App) draws them.
 *
 *   if (!(await confirmDialog({ title: 'Delete this alert?', confirmLabel: 'Delete', danger: true }))) return
 *   toast('Changes saved')
 *   toast(err.message, { type: 'error' })
 */

let state = { toasts: [], dialog: null }
const listeners = new Set()
let nextId = 0

function emit(next) {
  state = next
  listeners.forEach((listener) => listener())
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return state
}

export function dismissToast(id) {
  emit({ ...state, toasts: state.toasts.filter((t) => t.id !== id) })
}

/** type: success | error | info. Errors stay a little longer. */
export function toast(message, { type = 'success', duration } = {}) {
  if (!message) return
  const id = ++nextId
  emit({ ...state, toasts: [...state.toasts.slice(-3), { id, message: String(message), type }] })
  setTimeout(() => dismissToast(id), duration ?? (type === 'error' ? 7000 : 3500))
}

/** Resolves true when confirmed, false when cancelled (Cancel, Esc, or clicking outside). */
export function confirmDialog({ title, message = '', confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    state.dialog?.resolve(false) // only one at a time
    emit({ ...state, dialog: { title, message, confirmLabel, cancelLabel, danger, resolve } })
  })
}

export function closeDialog(result) {
  const dialog = state.dialog
  emit({ ...state, dialog: null })
  dialog?.resolve(Boolean(result))
}
