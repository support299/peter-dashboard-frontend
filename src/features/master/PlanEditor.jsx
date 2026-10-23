import { useState } from 'react'
import { api, money, readJson } from '../../lib'
import { STATUS_LABELS } from './constants'

/** Manual status (pause), pause details and MRR correction for one recurring plan. */
export function PlanEditor({ plan, onClose, onSaved }) {
  const [form, setForm] = useState({
    status_override: plan.status_override || '',
    pause_reason: plan.pause_reason || '',
    pause_start: plan.pause_start || '',
    expected_return: plan.expected_return || '',
    manual_monthly_value: plan.manual_monthly_value ?? '',
    manual_note: plan.manual_note || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pausing = ['paused', 'scheduled_resume'].includes(form.status_override)
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await readJson(await api(`/api/insights/mrr/plans/${plan.id}/`, { method: 'PATCH', body: JSON.stringify(form) }))
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="drill-backdrop nested" role="presentation" onClick={onClose}>
      <form className="plan-editor" role="dialog" aria-modal="true" aria-label={`Edit ${plan.client}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header>
          <p className="hero-kicker">Recurring plan</p>
          <h3>{plan.client}</h3>
          <p className="muted">
            {plan.frequency} · {money(plan.visit_value)} {plan.pricing_source === 'invoice' ? 'per invoice' : 'per visit'} · detected MRR{' '}
            {money(plan.detected_monthly_value)} ({plan.pricing_label}) · Jobber says{' '}
            {STATUS_LABELS[plan.detected_status] || plan.detected_status}
          </p>
        </header>

        <label>
          <span>Status</span>
          <select value={form.status_override} onChange={set('status_override')}>
            <option value="">Automatic (from Jobber)</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {pausing ? (
          <>
            <label>
              <span>Pause reason</span>
              <input value={form.pause_reason} onChange={set('pause_reason')} placeholder="e.g. Travelling for the winter" />
            </label>
            <div className="plan-editor-row">
              <label>
                <span>Pause start</span>
                <input type="date" value={form.pause_start} onChange={set('pause_start')} />
              </label>
              <label>
                <span>Expected return</span>
                <input type="date" value={form.expected_return} onChange={set('expected_return')} />
              </label>
            </div>
          </>
        ) : null}

        <label>
          <span>MRR correction (leave empty to use Jobber's price)</span>
          <input type="number" step="0.01" min="0" value={form.manual_monthly_value} onChange={set('manual_monthly_value')} />
        </label>
        <label>
          <span>Note</span>
          <textarea rows={2} value={form.manual_note} onChange={set('manual_note')} />
        </label>

        {error ? <div className="notice">{error}</div> : null}
        <footer>
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </footer>
      </form>
    </div>
  )
}
