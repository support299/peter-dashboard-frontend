import { useState } from 'react'
import { money, queryString, when } from '../../lib'
import { Panel } from '../master/MasterPages'
import { shortDate } from '../master/format'
import { useFetch, usePeriod } from '../master/periodState'
import { csvBlob, monthIso, saveBlob, send, useMeta } from './financeApi'
import { CategorySelect, Choice, Field } from './FinanceParts'

const TEMPLATE_EXAMPLE = [
  '2026-10-05',
  'Costco',
  'Cleaning products',
  '120.00',
  '6.00',
  '11.97',
  '137.97',
  'Cleaning supplies',
  '',
  'Shared',
  'Credit card',
  'Paid',
  '',
]

function MonthlyTotals({ meta }) {
  const { version, reload } = usePeriod()
  const [month, setMonth] = useState(monthIso())
  const [form, setForm] = useState({
    category_id: '',
    division: 'shared',
    amount: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const { data } = useFetch(`/api/financials/monthly-totals/${queryString({ month })}`, version)
  const groups = Object.fromEntries((meta?.groups || []).map((g) => [g.key, g.label]))

  async function add(event) {
    event.preventDefault()
    setError('')
    try {
      await send('/api/financials/monthly-totals/', {
        body: { ...form, month },
      })
      setForm({ category_id: '', division: 'shared', amount: '', notes: '' })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(total) {
    if (!window.confirm(`Delete the ${total.category} total? Reports go back to the individual expenses.`)) return
    try {
      await send(`/api/financials/monthly-totals/${total.id}/`, {
        method: 'DELETE',
      })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Panel
      title="Monthly totals & reconciliation"
      subtitle="Enter a month's total for a category (e.g. from a statement). Reports then use the total instead of that category's individual expenses, so nothing is counted twice."
      actions={<input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />}
    >
      <form className="fin-inline-form" onSubmit={add}>
        <CategorySelect meta={meta} value={form.category_id} onChange={(v) => setForm((p) => ({ ...p, category_id: v }))} />
        <Choice options={meta?.divisions} value={form.division} onChange={(v) => setForm((p) => ({ ...p, division: v }))} />
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="Total before tax"
          value={form.amount}
          onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
        />
        <input placeholder="Note (optional)" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        <button type="submit" className="primary" disabled={!form.category_id || form.amount === ''}>
          Save total
        </button>
      </form>
      {error ? <div className="notice">{error}</div> : null}
      <div className="drill-table-wrap">
        <table className="drill-table fin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Group</th>
              <th className="k-currency">Individual expenses</th>
              <th className="k-currency">Monthly total</th>
              <th className="k-currency">Difference</th>
              <th>Reports use</th>
            </tr>
          </thead>
          <tbody>
            {(data?.lines || []).map((line) => (
              <tr key={line.category_id}>
                <td>{line.category}</td>
                <td className="muted">{groups[line.group]}</td>
                <td className="k-currency">{money(line.individual)}</td>
                <td className="k-currency">{line.total == null ? '—' : money(line.total)}</td>
                <td className={`k-currency ${line.difference ? (line.difference > 0 ? 'fin-pos' : 'fin-neg') : ''}`}>
                  {line.difference == null ? '—' : money(line.difference)}
                </td>
                <td>{line.uses === 'total' ? <span className="fin-tag">Monthly total</span> : 'Individual expenses'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && !data.lines.length ? <p className="muted empty">No expenses or totals for this month.</p> : null}
      </div>
      {data?.totals?.length ? (
        <ul className="fin-list">
          {data.totals.map((t) => (
            <li key={t.id}>
              <span>
                <b>{t.category}</b> · {t.division_label} · {money(t.amount)}
                {t.notes ? <small className="muted"> · {t.notes}</small> : null}
                {t.contractor_pay_warning ? <small className="fin-warn-text"> · {t.contractor_pay_warning}</small> : null}
              </span>
              <button type="button" className="ghost tiny" onClick={() => remove(t)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  )
}

function ImportExpenses({ meta }) {
  const { version, reload } = usePeriod()
  const [file, setFile] = useState(null)
  const [options, setOptions] = useState({
    date_format: 'dmy',
    default_category: '',
    include_duplicates: false,
  })
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { data: history } = useFetch('/api/financials/import/batches/', version)

  async function run(commit) {
    if (!file) return
    setBusy(true)
    setError('')
    const form = new FormData()
    form.append('file', file)
    form.append('date_format', options.date_format)
    if (options.default_category) form.append('default_category', options.default_category)
    if (commit) {
      form.append('commit', '1')
      if (options.include_duplicates) form.append('include_duplicates', '1')
    }
    try {
      const payload = await send('/api/financials/import/', { body: form })
      if (commit) {
        setResult(payload.batch)
        setPreview(null)
        setFile(null)
        reload()
      } else {
        setPreview(payload)
        setResult(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function undo(batch) {
    if (!window.confirm(`Delete the ${batch.remaining} expenses imported from ${batch.file_name}?`)) return
    try {
      await send(`/api/financials/import/batches/${batch.id}/`, {
        method: 'DELETE',
      })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Panel
      title="Import expenses (CSV or Excel)"
      subtitle="The first row must hold column names. Only Date and Amount (or Total) are required; categories are matched by name. Nothing is saved until you click Import."
      actions={
        <button type="button" className="ghost tiny" onClick={() => saveBlob(csvBlob([meta?.import_columns || [], TEMPLATE_EXAMPLE]), 'expenses-template.csv')}>
          Download template
        </button>
      }
    >
      <div className="fin-inline-form">
        <label className="fin-file">
          <input
            type="file"
            accept=".csv,.xlsx,.xlsm,.txt"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null)
              setPreview(null)
              setResult(null)
            }}
          />
          <span>{file ? `📄 ${file.name}` : 'Choose a .csv or .xlsx file'}</span>
        </label>
        <Field label="Dates like 05/10/2026 are">
          <Choice
            options={[
              { key: 'dmy', label: 'day / month / year' },
              { key: 'mdy', label: 'month / day / year' },
            ]}
            value={options.date_format}
            onChange={(v) => setOptions((p) => ({ ...p, date_format: v }))}
          />
        </Field>
        <Field label="If a row has no category">
          <CategorySelect
            meta={meta}
            value={options.default_category}
            onChange={(v) => setOptions((p) => ({ ...p, default_category: v }))}
            placeholder="Show it as an error"
            allowEmpty
          />
        </Field>
        <button type="button" className="ghost" disabled={!file || busy} onClick={() => run(false)}>
          {busy && !preview ? 'Reading…' : 'Preview'}
        </button>
      </div>
      {error ? <div className="notice">{error}</div> : null}
      {result ? (
        <div className="notice good">
          Imported {result.imported} expense{result.imported === 1 ? '' : 's'}
          {result.skipped ? `, skipped ${result.skipped} (errors or duplicates)` : ''}.
        </div>
      ) : null}
      {preview ? (
        <>
          {preview.summary.taxes_missing ? (
            <div className="notice">
              This file has a Total but no “Amount before tax”, GST or QST columns, so the full total (tax included) will be counted as the cost. Add GST and
              QST columns if the totals include tax.
            </div>
          ) : null}
          <div className="fin-stats compact">
            <div>
              <span>Ready to import</span>
              <strong>{preview.summary.ready}</strong>
            </div>
            <div>
              <span>Already entered (duplicates)</span>
              <strong>{preview.summary.duplicates}</strong>
            </div>
            <div>
              <span>With errors (skipped)</span>
              <strong>{preview.summary.errors}</strong>
            </div>
          </div>
          <div className="drill-table-wrap fin-preview">
            <table className="drill-table fin-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Date</th>
                  <th>Vendor / description</th>
                  <th>Category</th>
                  <th className="k-currency">Before tax</th>
                  <th className="k-currency">Total</th>
                  <th>Check</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.row} className={row.errors.length ? 'fin-row-error' : row.duplicate ? 'fin-row-dup' : ''}>
                    <td>{row.row}</td>
                    <td>{row.date ? shortDate(row.date) : '—'}</td>
                    <td>
                      {row.vendor || '—'}
                      {row.description ? <small className="muted"> · {row.description}</small> : null}
                    </td>
                    <td>
                      {row.category}
                      {row.subcategory ? <small className="muted"> › {row.subcategory}</small> : null}
                    </td>
                    <td className="k-currency">{row.amount == null ? '—' : money(row.amount)}</td>
                    <td className="k-currency">{row.total == null ? '—' : money(row.total)}</td>
                    <td>{row.errors.length ? row.errors.join('; ') : row.duplicate ? 'Already entered' : 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="fin-actions">
            <label className="fin-check">
              <input
                type="checkbox"
                checked={options.include_duplicates}
                onChange={(e) =>
                  setOptions((p) => ({
                    ...p,
                    include_duplicates: e.target.checked,
                  }))
                }
              />
              Also import rows marked “Already entered”
            </label>
            <span className="spacer" />
            <button
              type="button"
              className="primary"
              disabled={busy || !(preview.summary.ready || (options.include_duplicates && preview.summary.duplicates))}
              onClick={() => run(true)}
            >
              {busy ? 'Importing…' : `Import ${preview.summary.ready + (options.include_duplicates ? preview.summary.duplicates : 0)} expenses`}
            </button>
          </div>
        </>
      ) : null}
      {history?.batches?.length ? (
        <>
          <h4 className="fin-subhead">Past imports</h4>
          <ul className="fin-list">
            {history.batches.map((b) => (
              <li key={b.id}>
                <span>
                  <b>{b.file_name}</b> · {when(b.created_at, true)} · {b.imported} imported
                  {b.skipped ? `, ${b.skipped} skipped` : ''}
                  {b.created_by ? <small className="muted"> · {b.created_by}</small> : null}
                </span>
                {b.remaining ? (
                  <button type="button" className="ghost tiny" onClick={() => undo(b)}>
                    Undo import
                  </button>
                ) : (
                  <small className="muted">Removed</small>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Panel>
  )
}

export function FinanceTotals() {
  const meta = useMeta()
  return (
    <div className="master finance">
      <MonthlyTotals meta={meta} />
      <ImportExpenses meta={meta} />
    </div>
  )
}
