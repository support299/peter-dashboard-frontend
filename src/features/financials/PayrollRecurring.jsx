import { useState } from 'react'
import { money, queryString } from '../../lib'
import { Panel } from '../master/MasterPages'
import { shortDate } from '../master/format'
import { useFetch, usePeriod } from '../master/periodState'
import { ExpenseForm } from './ExpenseForm'
import { openReceipt, send, toForm, todayIso, useMeta, subcategoriesOf } from './financeApi'
import { CategorySelect, Choice, Field, FinanceShell, Modal, ReceiptInput } from './FinanceParts'

// ——— Payroll ———
function PayRunForm({ meta, run, onClose, onSaved }) {
  const [form, setForm] = useState({
    pay_date: run?.pay_date || todayIso(),
    period_start: run?.period_start || '',
    period_end: run?.period_end || '',
    cleaning_amount: run?.cleaning_amount ?? '',
    office_amount: run?.office_amount ?? '',
    notes: run?.notes || '',
  })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))
  const total = Number(form.cleaning_amount || 0) + Number(form.office_amount || 0)

  async function save(event, confirmDuplicate = false) {
    event?.preventDefault()
    setSaving(true)
    setError('')
    const data = { ...form, confirm_duplicate: confirmDuplicate || undefined }
    try {
      if (run) {
        await send(`/api/financials/payroll/${run.id}/`, file ? { body: toForm(data, file) } : { method: 'PATCH', body: data })
      } else {
        await send('/api/financials/payroll/', {
          body: file ? toForm(data, file) : data,
        })
      }
      onSaved()
    } catch (err) {
      if (err.status === 409 && err.payload?.duplicates) setConfirm(true)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this pay run and its two payroll expenses?')) return
    try {
      await send(`/api/financials/payroll/${run.id}/`, { method: 'DELETE' })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title={run ? 'Edit pay run' : 'Add pay run'} kicker="Payroll (PayEvo)" onClose={onClose} onSubmit={save}>
      <p className="muted fin-help">
        Enter the <b>total employer cost</b> from the PayEvo pay run report: gross wages + employer contributions (QPP, EI, QPIP, CNESST…) + vacation pay. It
        counts in the month of the pay date.
      </p>
      <div className="fin-form-grid">
        <Field label="Pay date">
          <input type="date" value={form.pay_date} onChange={set('pay_date')} />
        </Field>
        <div />
        <Field label="Pay period from (optional)">
          <input type="date" value={form.period_start} onChange={set('period_start')} />
        </Field>
        <Field label="to">
          <input type="date" value={form.period_end} onChange={set('period_end')} />
        </Field>
        <Field label="Cleaning staff" hint="Cost of sales (COGS)">
          <input type="number" inputMode="decimal" step="0.01" value={form.cleaning_amount} onChange={set('cleaning_amount')} placeholder="0.00" />
        </Field>
        <Field label="Office & management" hint="Operating expenses">
          <input type="number" inputMode="decimal" step="0.01" value={form.office_amount} onChange={set('office_amount')} placeholder="0.00" />
        </Field>
        <p className="wide fin-total">Pay run total: {money(total)}</p>
        <div className="fin-field wide">
          <span>Pay run report (optional)</span>
          <ReceiptInput
            file={file}
            onChange={setFile}
            current={run?.has_receipt ? run.receipt_name || 'Report' : ''}
            onView={() => openReceipt(`/api/financials/payroll/${run.id}/receipt/`)}
            disabled={meta && !meta.storage_configured}
          />
        </div>
        <Field label="Notes" wide>
          <textarea rows={2} value={form.notes} onChange={set('notes')} />
        </Field>
      </div>
      {error ? <div className="notice">{error}</div> : null}
      <footer className="fin-actions">
        {run ? (
          <button type="button" className="ghost danger" onClick={remove}>
            Delete
          </button>
        ) : null}
        <span className="spacer" />
        <button type="button" className="ghost" onClick={onClose}>
          Cancel
        </button>
        {confirm ? (
          <button type="button" className="primary" disabled={saving} onClick={() => save(null, true)}>
            Save anyway
          </button>
        ) : (
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </footer>
    </Modal>
  )
}

export function FinancePayroll() {
  const meta = useMeta()
  const { params, version, reload } = usePeriod()
  const { data, error } = useFetch(`/api/financials/payroll/${queryString({ ...params, division: undefined })}`, version)
  const [editing, setEditing] = useState(null)
  return (
    <FinanceShell
      data={data}
      error={error}
      compareNote={false}
      actions={
        <button type="button" className="primary" onClick={() => setEditing('new')}>
          + Add pay run
        </button>
      }
    >
      <div className="fin-stats">
        <div>
          <span>Cleaning staff (COGS)</span>
          <strong>{money(data?.sums?.cleaning)}</strong>
        </div>
        <div>
          <span>Office & management</span>
          <strong>{money(data?.sums?.office)}</strong>
        </div>
        <div>
          <span>Total payroll</span>
          <strong>{money(data?.sums?.total)}</strong>
        </div>
      </div>
      <Panel title="Pay runs" subtitle="One entry per PayEvo pay run. Each one adds two expenses: cleaning staff (COGS) and office (operating expenses).">
        <div className="drill-table-wrap">
          <table className="drill-table fin-table">
            <thead>
              <tr>
                <th>Pay date</th>
                <th>Pay period</th>
                <th className="k-currency">Cleaning staff</th>
                <th className="k-currency">Office</th>
                <th className="k-currency">Total</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {(data?.results || []).map((run) => (
                <tr key={run.id} className="clickable" onClick={() => setEditing(run)}>
                  <td>{shortDate(run.pay_date)}</td>
                  <td>{run.period_start ? `${shortDate(run.period_start)} – ${shortDate(run.period_end)}` : '—'}</td>
                  <td className="k-currency">{money(run.cleaning_amount)}</td>
                  <td className="k-currency">{money(run.office_amount)}</td>
                  <td className="k-currency">
                    <strong>{money(run.total)}</strong>
                  </td>
                  <td>
                    {run.has_receipt ? (
                      <button
                        type="button"
                        className="ghost tiny"
                        onClick={(e) => {
                          e.stopPropagation()
                          openReceipt(`/api/financials/payroll/${run.id}/receipt/`)
                        }}
                      >
                        📎
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.results.length ? <p className="muted empty">No pay runs in this period.</p> : null}
        </div>
      </Panel>
      {editing ? (
        <PayRunForm
          meta={meta}
          run={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      ) : null}
    </FinanceShell>
  )
}

// ——— Recurring expenses ———
function RecurringForm({ meta, rec, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: rec?.name || '',
    vendor: rec?.vendor || '',
    description: rec?.description || '',
    amount: rec?.amount ?? '',
    gst: rec?.gst ?? '',
    qst: rec?.qst ?? '',
    category_id: rec?.category_id || '',
    subcategory_id: rec?.subcategory_id || '',
    division: rec?.division || 'shared',
    payment_method: rec?.payment_method || '',
    frequency: rec?.frequency || 'monthly',
    start_date: rec?.start_date || todayIso(),
    end_date: rec?.end_date || '',
    is_active: rec ? rec.is_active : true,
    notes: rec?.notes || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const subs = subcategoriesOf(meta, form.category_id)
  const set = (key) => (value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value?.target ? value.target.value : value,
      ...(key === 'category_id' ? { subcategory_id: '' } : {}),
    }))

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = { ...form, subcategory_id: form.subcategory_id || null }
      if (rec)
        await send(`/api/financials/recurring/${rec.id}/`, {
          method: 'PATCH',
          body,
        })
      else await send('/api/financials/recurring/', { body })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this recurring expense? Charges already verified stay; ones waiting to be verified are removed.')) return
    try {
      await send(`/api/financials/recurring/${rec.id}/`, { method: 'DELETE' })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title={rec ? 'Edit recurring expense' : 'Add recurring expense'} kicker="Recurring" onClose={onClose} onSubmit={save}>
      <div className="fin-form-grid">
        <Field label="Name" wide>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Office rent" />
        </Field>
        <Field label="Vendor">
          <input value={form.vendor} onChange={set('vendor')} />
        </Field>
        <Field label="Description">
          <input value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Amount before tax">
          <input type="number" inputMode="decimal" step="0.01" value={form.amount} onChange={set('amount')} />
        </Field>
        <Field label="Frequency">
          <Choice options={meta?.frequencies} value={form.frequency} onChange={set('frequency')} />
        </Field>
        <Field label="GST (TPS)">
          <input type="number" inputMode="decimal" step="0.01" value={form.gst} onChange={set('gst')} />
        </Field>
        <Field label="QST (TVQ)">
          <input type="number" inputMode="decimal" step="0.01" value={form.qst} onChange={set('qst')} />
        </Field>
        <Field label="Category">
          <CategorySelect meta={meta} value={form.category_id} onChange={set('category_id')} />
        </Field>
        {subs.length ? (
          <Field label="Subcategory">
            <select value={form.subcategory_id || ''} onChange={(e) => set('subcategory_id')(e.target.value ? Number(e.target.value) : '')}>
              <option value="">—</option>
              {subs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Division">
          <Choice options={meta?.divisions} value={form.division} onChange={set('division')} />
        </Field>
        <Field label="Payment method">
          <Choice options={meta?.payment_methods} value={form.payment_method} onChange={set('payment_method')} empty="—" />
        </Field>
        <Field label="First charge date" hint="Charges more than 2 months back aren't created: enter those as expenses or import them.">
          <input type="date" value={form.start_date} onChange={set('start_date')} />
        </Field>
        <Field label="End date (optional)">
          <input type="date" value={form.end_date} onChange={set('end_date')} />
        </Field>
        <label className="fin-check wide">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active')(e.target.checked)} />
          Active (create a charge on each due date)
        </label>
        <Field label="Notes" wide>
          <textarea rows={2} value={form.notes} onChange={set('notes')} />
        </Field>
      </div>
      {error ? <div className="notice">{error}</div> : null}
      <footer className="fin-actions">
        {rec ? (
          <button type="button" className="ghost danger" onClick={remove}>
            Delete
          </button>
        ) : null}
        <span className="spacer" />
        <button type="button" className="ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </footer>
    </Modal>
  )
}

export function FinanceRecurring() {
  const meta = useMeta()
  const { version, reload } = usePeriod()
  const { data, error } = useFetch('/api/financials/recurring/', version)
  const [editing, setEditing] = useState(null)
  const [verifying, setVerifying] = useState(null)
  const today = todayIso()
  const pending = data?.pending || []

  async function skip(row) {
    if (!window.confirm(`Mark “${row.description || row.vendor}” on ${shortDate(row.date)} as not charged? It won't be created again.`)) return
    try {
      await send(`/api/financials/expenses/${row.id}/skip/`)
      reload()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div className="master finance">
      {error ? <div className="notice">{error}</div> : null}
      <Panel
        title="Waiting to be verified"
        subtitle="Each charge is created on its due date. Check it against your bank or card statement, correct the amount if needed, then verify. Only verified charges count in totals."
      >
        {pending.length ? (
          <div className="drill-table-wrap">
            <table className="drill-table fin-table">
              <thead>
                <tr>
                  <th>Due</th>
                  <th>Expense</th>
                  <th>Category</th>
                  <th className="k-currency">Expected</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {shortDate(row.date)}
                      {row.date > today ? <span className="fin-tag">Upcoming</span> : null}
                    </td>
                    <td>
                      <strong>{row.description || row.vendor}</strong>
                      {row.vendor && row.description ? <small className="muted"> · {row.vendor}</small> : null}
                    </td>
                    <td>{row.category}</td>
                    <td className="k-currency">{money(row.total)}</td>
                    <td>
                      <div className="fin-row-actions">
                        <button type="button" className="primary tiny" onClick={() => setVerifying(row)}>
                          Verify
                        </button>
                        <button type="button" className="ghost tiny" onClick={() => skip(row)}>
                          Not charged
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nothing to verify. 🎉</p>
        )}
      </Panel>
      <Panel
        title="Recurring expenses"
        subtitle="Rent, insurance, phone, software… Set the amount, frequency and dates once."
        actions={
          <button type="button" className="primary" onClick={() => setEditing('new')}>
            + Add recurring expense
          </button>
        }
      >
        <div className="drill-table-wrap">
          <table className="drill-table fin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th className="k-currency">Amount (with tax)</th>
                <th>Frequency</th>
                <th>Next charge</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.results || []).map((rec) => (
                <tr key={rec.id} className="clickable" onClick={() => setEditing(rec)}>
                  <td>
                    <strong>{rec.name}</strong>
                    {rec.vendor ? <small className="muted"> · {rec.vendor}</small> : null}
                  </td>
                  <td>{rec.category}</td>
                  <td className="k-currency">{money(rec.total)}</td>
                  <td>{rec.frequency_label}</td>
                  <td>{rec.next_due ? shortDate(rec.next_due) : '—'}</td>
                  <td>
                    <span className={`status-pill ${rec.is_active ? 's-active' : 's-cancelled'}`}>{rec.is_active ? 'Active' : 'Stopped'}</span>
                    {rec.pending ? <span className="fin-tag warn">{rec.pending} to verify</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.results.length ? <p className="muted empty">No recurring expenses yet.</p> : null}
        </div>
      </Panel>
      {editing ? (
        <RecurringForm
          meta={meta}
          rec={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      ) : null}
      {verifying ? (
        <ExpenseForm
          meta={meta}
          expense={verifying}
          mode="verify"
          onClose={() => setVerifying(null)}
          onSaved={() => {
            setVerifying(null)
            reload()
          }}
        />
      ) : null}
    </div>
  )
}
