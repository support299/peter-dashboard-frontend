import { useState } from 'react'
import { api, readJson } from '../../lib'
import { CANCELLATION_REASONS } from './constants'

/** Reason dropdown + optional note for one cancellation; saves as soon as it changes. */
export function ReasonEditor({ record, onSaved }) {
  const [reason, setReason] = useState(record.reason || '')
  const [notes, setNotes] = useState(record.reason_notes || '')
  const [state, setState] = useState('')

  async function save(patch) {
    setState('saving')
    try {
      await readJson(
        await api(`/api/insights/cancellations/${record.id}/`, { method: 'PATCH', body: JSON.stringify(patch) }),
      )
      setState('saved')
      onSaved?.()
    } catch (err) {
      setState(err.message || 'Could not save')
    }
  }

  return (
    <div className="reason-editor">
      <select
        aria-label="Cancellation reason"
        value={reason}
        onChange={(e) => {
          setReason(e.target.value)
          save({ reason: e.target.value })
        }}
      >
        <option value="">Choose a reason…</option>
        {CANCELLATION_REASONS.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
      <input
        aria-label="Notes"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== (record.reason_notes || '') && save({ reason_notes: notes })}
      />
      {state === 'saving' ? <span className="muted tiny-text">Saving…</span> : null}
      {state && !['saving', 'saved'].includes(state) ? <span className="error-text">{state}</span> : null}
    </div>
  )
}
