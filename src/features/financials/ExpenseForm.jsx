import { useState } from 'react'
import { money } from '../../lib'
import { shortDate } from '../master/format'
import { GST_RATE, QST_RATE, openReceipt, round2, send, toForm, todayIso, subcategoriesOf } from './financeApi'
import { CategorySelect, Choice, Field, Modal, ReceiptInput } from './FinanceParts'
import { confirmDialog } from '../../lib/feedback'

const FIELDS = ['date', 'vendor', 'description', 'amount', 'gst', 'qst', 'category_id', 'subcategory_id', 'division', 'payment_method', 'status', 'notes']

function initial(expense, mode) {
  if (!expense) {
    return {
      date: todayIso(),
      vendor: '',
      description: '',
      amount: '',
      gst: '',
      qst: '',
      category_id: '',
      subcategory_id: '',
      division: 'shared',
      payment_method: '',
      status: 'paid',
      notes: '',
    }
  }
  const values = Object.fromEntries(FIELDS.map((key) => [key, expense[key] ?? '']))
  // Verifying a recurring charge means it was charged: default to Paid (it can still be changed).
  if (mode === 'verify') values.status = 'paid'
  return values
}

function totalOf(form) {
  return round2(Number(form.amount || 0) + Number(form.gst || 0) + Number(form.qst || 0))
}

/**
 * Add, edit or verify an expense. `mode`: create | edit | verify (a recurring charge).
 * Shows likely duplicates and lets the user save anyway.
 */
export function ExpenseForm({ meta, expense, mode = expense ? 'edit' : 'create', onClose, onSaved }) {
  const [form, setForm] = useState(() => initial(expense, mode))
  const [total, setTotal] = useState(() => (expense ? String(expense.total) : ''))
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState(null)
  const subs = subcategoriesOf(meta, form.category_id)
  const fromPayroll = Boolean(expense?.pay_run_id || expense?.automatic)
  const [warning, setWarning] = useState('')

  const set = (key) => (value) =>
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value?.target ? value.target.value : value,
      }
      if (key === 'category_id') next.subcategory_id = ''
      if (['amount', 'gst', 'qst'].includes(key)) setTotal(String(totalOf(next) || ''))
      return next
    })

  function addTaxes() {
    const amount = Number(form.amount || 0)
    const next = {
      ...form,
      gst: round2(amount * GST_RATE).toFixed(2),
      qst: round2(amount * QST_RATE).toFixed(2),
    }
    setForm(next)
    setTotal(String(totalOf(next)))
  }

  function splitFromTotal() {
    const gross = Number(total || 0)
    const amount = round2(gross / (1 + GST_RATE + QST_RATE))
    const gst = round2(amount * GST_RATE)
    setForm((prev) => ({
      ...prev,
      amount: amount.toFixed(2),
      gst: gst.toFixed(2),
      qst: round2(gross - amount - gst).toFixed(2),
    }))
  }

  async function save(confirmDuplicate = false) {
    setSaving(true)
    setError('')
    const data = {
      ...form,
      subcategory_id: form.subcategory_id || null,
      confirm_duplicate: confirmDuplicate || undefined,
    }
    try {
      let result
      if (mode === 'create') {
        result = await send('/api/financials/expenses/', {
          body: file ? toForm(data, file) : data,
        })
      } else if (mode === 'verify') {
        result = await send(`/api/financials/expenses/${expense.id}/verify/`, {
          body: data,
        })
        if (file)
          await send(`/api/financials/expenses/${expense.id}/receipt/`, {
            body: toForm({}, file),
          })
      } else if (file) {
        result = await send(`/api/financials/expenses/${expense.id}/`, {
          body: toForm(data, file),
        })
      } else {
        result = await send(`/api/financials/expenses/${expense.id}/`, {
          method: 'PATCH',
          body: data,
        })
      }
      onSaved?.(result?.expense)
    } catch (err) {
      if (err.status === 409 && (err.payload?.duplicates?.length || err.payload?.contractor_pay_warning)) {
        setDuplicates(err.payload.duplicates || [])
        setWarning(err.payload.contractor_pay_warning || '')
      } else setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!(await confirmDialog({ title: 'Delete this expense?', message: 'This can’t be undone.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await send(`/api/financials/expenses/${expense.id}/`, {
        method: 'DELETE',
      })
      onSaved?.(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeReceipt() {
    if (!(await confirmDialog({ title: 'Remove the attached receipt?', confirmLabel: 'Remove', danger: true }))) return
    try {
      await send(`/api/financials/expenses/${expense.id}/receipt/`, {
        method: 'DELETE',
      })
      onSaved?.({ ...expense, has_receipt: false })
    } catch (err) {
      setError(err.message)
    }
  }

  const title = mode === 'create' ? 'Add expense' : mode === 'verify' ? 'Verify recurring charge' : 'Edit expense'
  const totalMismatch = total !== '' && Math.abs(Number(total) - totalOf(form)) > 0.009

  return (
    <Modal
      title={title}
      kicker={mode === 'verify' ? 'Check it against the real charge' : 'Expense'}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      {fromPayroll ? (
        <div className="notice">
          {expense?.automatic
            ? 'This expense is added automatically from contractor pay in the Hub. Change the pay in the Hub.'
            : 'This expense comes from a pay run. Edit it on the Payroll page.'}
        </div>
      ) : null}
      {expense?.contractor_pay_warning ? <div className="notice">{expense.contractor_pay_warning}</div> : null}
      <div className="fin-form-grid">
        <Field label="Date">
          <input type="date" value={form.date} onChange={set('date')} required />
        </Field>
        <Field label="Vendor / supplier">
          <input value={form.vendor} onChange={set('vendor')} placeholder="e.g. Costco" autoFocus={mode === 'create'} />
        </Field>
        <Field label="Description" wide>
          <input value={form.description} onChange={set('description')} placeholder="What was it for?" />
        </Field>

        <Field label="Amount before tax">
          <input type="number" inputMode="decimal" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
        </Field>
        <Field label="Total paid (with tax)" hint={totalMismatch ? 'Doesn’t match amount + taxes. Use “Split taxes” or fix the amounts.' : null}>
          <input type="number" inputMode="decimal" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="GST (TPS)">
          <input type="number" inputMode="decimal" step="0.01" value={form.gst} onChange={set('gst')} placeholder="0.00" />
        </Field>
        <Field label="QST (TVQ)">
          <input type="number" inputMode="decimal" step="0.01" value={form.qst} onChange={set('qst')} placeholder="0.00" />
        </Field>
        <div className="fin-tax-tools wide">
          <button type="button" className="ghost tiny" onClick={addTaxes} disabled={!form.amount}>
            + Add GST & QST to the amount
          </button>
          <button type="button" className="ghost tiny" onClick={splitFromTotal} disabled={!total}>
            Split taxes from the total
          </button>
          <span className="muted">Total: {money(totalOf(form))}</span>
        </div>

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
        <Field label="Status">
          <div className="seg">
            {(meta?.statuses || []).map((s) => (
              <button key={s.key} type="button" className={form.status === s.key ? 'active' : ''} onClick={() => set('status')(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="fin-field wide">
          <span>Receipt or invoice</span>
          <ReceiptInput
            file={file}
            onChange={setFile}
            current={expense?.has_receipt ? expense.receipt_name || 'Receipt' : ''}
            onView={() => openReceipt(`/api/financials/expenses/${expense.id}/receipt/`)}
            onRemove={mode === 'edit' ? removeReceipt : null}
            disabled={meta && !meta.storage_configured}
          />
        </div>
        <Field label="Notes (optional)" wide>
          <textarea rows={2} value={form.notes} onChange={set('notes')} />
        </Field>
      </div>

      {duplicates ? (
        <div className="fin-duplicates">
          {warning ? <strong>{warning}</strong> : null}
          {duplicates.length ? <strong>This looks like an expense that’s already entered:</strong> : null}
          <ul>
            {duplicates.map((d) => (
              <li key={d.id}>
                {shortDate(d.date)} · {d.vendor || d.description} · {money(d.total)} · {d.category}
                {d.pending_verification ? ' (recurring charge waiting to be verified — verify that one instead)' : ''}
              </li>
            ))}
          </ul>
          <div className="fin-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setDuplicates(null)
                setWarning('')
              }}
            >
              Go back
            </button>
            <button type="button" className="primary" disabled={saving} onClick={() => save(true)}>
              It’s different, save anyway
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="notice">{error}</div> : null}
      {!duplicates ? (
        <footer className="fin-actions">
          {mode === 'edit' && !fromPayroll ? (
            <button type="button" className="ghost danger" onClick={remove}>
              Delete
            </button>
          ) : null}
          <span className="spacer" />
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving || fromPayroll}>
            {saving ? 'Saving…' : mode === 'verify' ? 'Verify' : 'Save'}
          </button>
        </footer>
      ) : null}
    </Modal>
  )
}
