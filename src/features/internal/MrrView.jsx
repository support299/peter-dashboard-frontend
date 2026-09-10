import { useCallback, useEffect, useState } from 'react'
import { api, money, number, queryString, readJson, when } from '../../lib'
import { AnimatedMetric } from '../dashboard/metrics'
import { MrrActiveIcon, MrrLostIcon, MrrNetIcon, MrrNewIcon } from './icons'

const EMPTY_FORM = {
  name: '',
  start_date: '',
  end_date: '',
  contract: 'Residential',
  status: 'Active',
  frequency: 'Monthly',
  plan_type: '',
  visit_value: '',
  hours_per_visit: '',
  method: '',
  cancellation_reason: '',
  client_comments: '',
  sales_person: '',
  notes: '',
}

function toForm(row) {
  return {
    name: row.name || '',
    start_date: row.start_date || '',
    end_date: row.end_date || '',
    contract: row.contract || 'Residential',
    status: row.status || 'Active',
    frequency: row.frequency || 'Monthly',
    plan_type: row.plan_type || '',
    visit_value: row.visit_value != null ? String(row.visit_value) : '',
    hours_per_visit: row.hours_per_visit != null ? String(row.hours_per_visit) : '',
    method: row.method || '',
    cancellation_reason: row.cancellation_reason || '',
    client_comments: row.client_comments || '',
    sales_person: row.sales_person || '',
    notes: row.notes || '',
  }
}

function MrrKpis({ kpis }) {
  const net = Number(kpis.net_mrr || 0)
  const netTone = net > 0 ? 'teal' : net < 0 ? 'rose' : 'slate'
  const side = [
    {
      key: 'new',
      label: 'New MRR',
      tone: 'teal',
      hint: `${number(kpis.new_count || 0)} started this period`,
      Icon: MrrNewIcon,
      kpi: { value: kpis.new_mrr || 0, kind: 'currency' },
    },
    {
      key: 'lost',
      label: 'Lost MRR',
      tone: 'rose',
      hint: `${number(kpis.lost_count || 0)} ended this period`,
      Icon: MrrLostIcon,
      kpi: { value: kpis.lost_mrr || 0, kind: 'currency' },
    },
    {
      key: 'net',
      label: 'Net MRR',
      tone: netTone,
      hint: 'New − lost',
      Icon: MrrNetIcon,
      kpi: { value: kpis.net_mrr || 0, kind: 'currency' },
    },
  ]

  return (
    <section className="internal-top-grid mrr-top-grid">
      <div className="internal-hero-card mrr-hero-card anim-rise" style={{ '--delay': '40ms' }}>
        <div className="internal-hero-main">
          <div className="internal-hero-icon-wrap">
            <MrrActiveIcon />
          </div>
          <div>
            <span className="internal-eyebrow">Active book</span>
            <AnimatedMetric kpi={{ value: kpis.active_mrr || 0, kind: 'currency' }} delay={40} />
            <p>{number(kpis.active_count || 0)} active clients · current monthly recurring</p>
          </div>
        </div>
        <div className="mrr-hero-side">
          <span>Portfolio</span>
          <strong>{number(kpis.active_count || 0)}</strong>
          <em>live accounts</em>
        </div>
      </div>

      {side.map((item, index) => {
        const Icon = item.Icon
        return (
          <div
            key={item.key}
            className={`internal-stat tone-${item.tone} anim-rise`}
            style={{ '--delay': `${120 + index * 70}ms` }}
          >
            <div className="internal-stat-top">
              <span>{item.label}</span>
              <span className={`internal-icon-wrap ${item.key}`}>
                <Icon />
              </span>
            </div>
            <AnimatedMetric kpi={item.kpi} delay={120 + index * 70} />
            <em>{item.hint}</em>
          </div>
        )
      })}
    </section>
  )
}

function MrrFormModal({ title, form, setForm, error, busy, onClose, onSubmit }) {
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))
  return (
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="auth-card auth-modal mrr-modal"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-brand">
          <div>
            <h1>{title}</h1>
            <p>Monthly value and CLV recalculate from visit value + frequency</p>
          </div>
        </div>
        {error ? <div className="notice">{error}</div> : null}
        <label className="mrr-field">
          <span>Client name</span>
          <input value={form.name} onChange={set('name')} required />
        </label>
        <div className="mrr-form-grid">
          <label className="mrr-field">
            <span>Start date</span>
            <input type="date" value={form.start_date} onChange={set('start_date')} />
          </label>
          <label className="mrr-field">
            <span>End date</span>
            <input type="date" value={form.end_date} onChange={set('end_date')} />
          </label>
          <label className="mrr-field">
            <span>Status</span>
            <select value={form.status} onChange={set('status')}>
              <option>Active</option>
              <option>Inactive</option>
              <option>Cancelled</option>
            </select>
          </label>
          <label className="mrr-field">
            <span>Frequency</span>
            <select value={form.frequency} onChange={set('frequency')}>
              <option>Monthly</option>
              <option>Bi-Weekly</option>
              <option>Weekly</option>
            </select>
          </label>
          <label className="mrr-field">
            <span>Contract</span>
            <input value={form.contract} onChange={set('contract')} />
          </label>
          <label className="mrr-field">
            <span>Plan type</span>
            <select value={form.plan_type} onChange={set('plan_type')}>
              <option value="">—</option>
              <option>Basic</option>
              <option>Detailed</option>
              <option>Custom</option>
            </select>
          </label>
          <label className="mrr-field">
            <span>Visit value</span>
            <input type="number" step="0.01" min="0" value={form.visit_value} onChange={set('visit_value')} required />
          </label>
          <label className="mrr-field">
            <span>Hours / visit</span>
            <input type="number" step="0.01" min="0" value={form.hours_per_visit} onChange={set('hours_per_visit')} />
          </label>
          <label className="mrr-field">
            <span>Method</span>
            <input value={form.method} onChange={set('method')} />
          </label>
          <label className="mrr-field">
            <span>Sales person</span>
            <input value={form.sales_person} onChange={set('sales_person')} />
          </label>
        </div>
        <label className="mrr-field">
          <span>Cancellation reason</span>
          <input value={form.cancellation_reason} onChange={set('cancellation_reason')} />
        </label>
        <label className="mrr-field">
          <span>Client comments</span>
          <textarea rows={2} value={form.client_comments} onChange={set('client_comments')} />
        </label>
        <label className="mrr-field">
          <span>Notes</span>
          <textarea rows={2} value={form.notes} onChange={set('notes')} />
        </label>
        <div className="auth-modal-actions">
          <button className="ghost" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function MrrView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [frequency, setFrequency] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [importMsg, setImportMsg] = useState('')

  const load = useCallback(
    async (nextPage = page) => {
      setLoading(true)
      setError('')
      try {
        const payload = await readJson(
          await api(
            `/api/admin-internal/mrr/${queryString({
              page: nextPage,
              page_size: 50,
              q,
              status,
              frequency,
              from,
              to,
            })}`,
          ),
        )
        setData(payload)
        setPage(payload.page || nextPage)
      } catch (err) {
        setError(err.message || 'Could not load MRR')
      } finally {
        setLoading(false)
      }
    },
    [page, q, status, frequency, from, to],
  )

  useEffect(() => {
    load(1)
  }, [q, status, frequency, from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError('')
    setEditingId(null)
    setModal('create')
  }

  function openEdit(row) {
    setForm(toForm(row))
    setFormError('')
    setEditingId(row.id)
    setModal('edit')
  }

  async function saveForm(event) {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const body = {
        ...form,
        visit_value: form.visit_value === '' ? 0 : Number(form.visit_value),
        hours_per_visit: form.hours_per_visit === '' ? null : Number(form.hours_per_visit),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      if (modal === 'create') {
        await readJson(
          await api('/api/admin-internal/mrr/create/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
        )
      } else {
        await readJson(
          await api(`/api/admin-internal/mrr/${editingId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
        )
      }
      setModal(null)
      await load(page)
    } catch (err) {
      setFormError(err.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function removeRow(row) {
    if (!window.confirm(`Delete MRR row for ${row.name}?`)) return
    setBusy(true)
    try {
      await readJson(await api(`/api/admin-internal/mrr/${row.id}/`, { method: 'DELETE' }))
      await load(page)
    } catch (err) {
      setError(err.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  async function importLockins() {
    setBusy(true)
    setImportMsg('')
    setError('')
    try {
      const payload = await readJson(
        await api('/api/admin-internal/mrr/import-lockins/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ only_locked: true }),
        }),
      )
      setImportMsg(`Lock-ins: ${payload.created} created, ${payload.updated} updated, ${payload.skipped} skipped (manual).`)
      await load(1)
    } catch (err) {
      setError(err.message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const kpis = data?.kpis || {}
  const filters = data?.filters || {}
  const rows = data?.results || []

  return (
    <div className="mrr-page">
      <MrrKpis kpis={kpis} />

      <div className="mrr-chrome">
        <header className="panel-head mrr-head">
          <div>
            <h3>MRR bookings</h3>
            <p>Manual entries + lock-in pulls. Manual edits win on conflict.</p>
          </div>
          <div className="mrr-actions">
            <button className="ghost" type="button" onClick={importLockins} disabled={busy}>
              Import lock-ins
            </button>
            <button className="primary" type="button" onClick={openCreate} disabled={busy}>
              Add client
            </button>
            <span className="meta-pill">{number(data?.count || 0)} total</span>
          </div>
        </header>

        {importMsg ? <p className="hint mrr-banner">{importMsg}</p> : null}
        {error ? <div className="notice">{error}</div> : null}

        <div className="toolbar filters mrr-filters">
          <input
            type="search"
            placeholder="Search name, sales, notes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {(filters.statuses || ['Active', 'Inactive', 'Cancelled']).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="">All frequencies</option>
            {(filters.frequencies || ['Weekly', 'Bi-Weekly', 'Monthly']).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
        </div>
      </div>

      <div className="mrr-table-shell">
        {loading && !data ? <p className="empty muted">Loading…</p> : null}
        {!loading && !rows.length ? <p className="empty muted">Nothing here yet. Add a client or import lock-ins.</p> : null}

        {rows.length ? (
          <table className="table mrr-table">
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Status</th>
                <th scope="col" title="Plan type (Basic, Detailed, or Custom)">
                  Plan
                </th>
                <th scope="col" title="Frequency">
                  Freq
                </th>
                <th scope="col" title="Visits per month">
                  Visits/mo
                </th>
                <th scope="col" title="Hours per visit">
                  Hrs/V
                </th>
                <th scope="col" title="Hours per month">
                  Hrs/mo
                </th>
                <th scope="col" title="Visit value">
                  Visit $
                </th>
                <th scope="col" title="Monthly Recurring Revenue">
                  MRR
                </th>
                <th scope="col" title="Yearly value (MRR × 12)">
                  Yearly
                </th>
                <th scope="col" title="Start date">
                  Start
                </th>
                <th scope="col" title="End date">
                  End
                </th>
                <th scope="col" title="Customer Lifetime Value">
                  CLV
                </th>
                <th scope="col" title="Where this row came from">
                  Source
                </th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div>{row.name}</div>
                    <div className="hint">{row.contract || '—'}</div>
                  </td>
                  <td>
                    <span className={`chip ${row.status === 'Active' ? 'good' : row.status === 'Cancelled' ? 'bad' : ''}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.plan_type || '—'}</td>
                  <td>{row.frequency}</td>
                  <td>{number(row.visits_per_month)}</td>
                  <td>{row.hours_per_visit != null ? number(row.hours_per_visit) : '—'}</td>
                  <td>{row.hours_per_month != null ? number(row.hours_per_month) : '—'}</td>
                  <td>{money(row.visit_value)}</td>
                  <td>{money(row.monthly_value)}</td>
                  <td>{money(row.yearly_value)}</td>
                  <td>{when(row.start_date)}</td>
                  <td>{when(row.end_date)}</td>
                  <td>{row.status === 'Active' ? '—' : money(row.clv)}</td>
                  <td>
                    <span className="hint">
                      {row.source}
                      {row.source === 'lockin' && row.manual_override ? ' · edited' : ''}
                    </span>
                  </td>
                  <td className="mrr-row-actions">
                    <button className="ghost tiny" type="button" onClick={() => openEdit(row)} disabled={busy}>
                      Edit
                    </button>
                    <button className="ghost tiny" type="button" onClick={() => removeRow(row)} disabled={busy}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {data?.pages > 1 ? (
          <div className="pager">
            <button type="button" disabled={page <= 1 || busy} onClick={() => load(page - 1)}>
              Previous
            </button>
            <span className="hint">
              Page {data.page} of {data.pages}
            </span>
            <button type="button" disabled={page >= data.pages || busy} onClick={() => load(page + 1)}>
              Next
            </button>
          </div>
        ) : null}
      </div>

      {modal ? (
        <MrrFormModal
          title={modal === 'create' ? 'Add MRR client' : 'Edit MRR client'}
          form={form}
          setForm={setForm}
          error={formError}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={saveForm}
        />
      ) : null}
    </div>
  )
}
