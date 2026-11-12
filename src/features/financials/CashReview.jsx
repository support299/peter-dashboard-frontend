import { useState } from 'react'
import { money, when } from '../../lib'
import { KpiGrid, RowName } from '../master/KpiCard'
import { BreakdownTable, Panel } from '../master/MasterPages'
import { formatChange, monthName, shortDate, tone } from '../master/format'
import { useComparisons, useFetch, useInsights, usePeriod } from '../master/periodState'
import { atLeast, monthIso, send, todayIso, useMeta } from './financeApi'
import { Choice, Field, FinanceShell, Modal } from './FinanceParts'
import { SkeletonPage } from '../../components/Skeleton'
import { confirmDialog } from '../../lib/feedback'

// ——— Cash & Debt ———
function AccountForm({ meta, account, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: account?.name || '',
    kind: account?.kind || 'bank',
    institution: account?.institution || '',
    credit_limit: account?.credit_limit ?? '',
    interest_rate: account?.interest_rate ?? '',
    notes: account?.notes || '',
    balance: '',
    balance_date: todayIso(),
  })
  const [error, setError] = useState('')
  const set = (key) => (value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value?.target ? value.target.value : value,
    }))
  const debt = form.kind !== 'bank'

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      if (account) {
        const { balance, balance_date, ...rest } = form // eslint-disable-line no-unused-vars
        await send(`/api/financials/accounts/${account.id}/`, {
          method: 'PATCH',
          body: rest,
        })
      } else {
        await send('/api/financials/accounts/', { body: form })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  async function archive() {
    if (!(await confirmDialog({ title: `Remove ${account.name}?`, message: 'Accounts with balance history are archived instead.', confirmLabel: 'Remove', danger: true }))) return
    try {
      await send(`/api/financials/accounts/${account.id}/`, {
        method: 'DELETE',
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title={account ? `Edit ${account.name}` : 'Add account'} kicker="Cash & Debt" onClose={onClose} onSubmit={save}>
      <div className="fin-form-grid">
        <Field label="Name" wide>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Desjardins chequing, Visa Business, Truck loan" />
        </Field>
        <Field label="Type">
          <Choice options={meta?.account_kinds} value={form.kind} onChange={set('kind')} />
        </Field>
        <Field label="Bank / lender">
          <input value={form.institution} onChange={set('institution')} />
        </Field>
        {debt ? (
          <>
            <Field label={form.kind === 'loan' ? 'Original amount (optional)' : 'Credit limit (optional)'}>
              <input type="number" inputMode="decimal" step="0.01" value={form.credit_limit} onChange={set('credit_limit')} />
            </Field>
            <Field label="Interest rate % per year (optional)">
              <input type="number" inputMode="decimal" step="0.001" value={form.interest_rate} onChange={set('interest_rate')} />
            </Field>
          </>
        ) : null}
        {!account ? (
          <>
            <Field label={debt ? 'Amount owed today' : 'Balance today'}>
              <input type="number" inputMode="decimal" step="0.01" value={form.balance} onChange={set('balance')} />
            </Field>
            <Field label="As of">
              <input type="date" value={form.balance_date} onChange={set('balance_date')} />
            </Field>
          </>
        ) : null}
        <Field label="Notes" wide>
          <textarea rows={2} value={form.notes} onChange={set('notes')} />
        </Field>
      </div>
      {error ? <div className="notice">{error}</div> : null}
      <footer className="fin-actions">
        {account ? (
          <button type="button" className="ghost danger" onClick={archive}>
            Remove
          </button>
        ) : null}
        <span className="spacer" />
        <button type="button" className="ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="primary">
          Save
        </button>
      </footer>
    </Modal>
  )
}

function BalanceForm({ account, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: todayIso(),
    balance: '',
    notes: '',
  })
  const [error, setError] = useState('')

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      await send(`/api/financials/accounts/${account.id}/balances/`, {
        body: form,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeEntry(entry) {
    if (!(await confirmDialog({ title: `Delete the balance of ${shortDate(entry.date)}?`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await send(`/api/financials/balances/${entry.id}/`, { method: 'DELETE' })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title={`Update ${account.name}`} kicker={account.is_debt ? 'Amount owed' : 'Balance'} onClose={onClose} onSubmit={save}>
      <div className="fin-form-grid">
        <Field label="Date">
          <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
        </Field>
        <Field label={account.is_debt ? 'Amount owed' : 'Balance'} hint={account.is_debt ? 'Enter what you owe as a positive number.' : null}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.balance}
            onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
            autoFocus
          />
        </Field>
        <Field label="Note (optional)" wide>
          <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </Field>
      </div>
      {account.history?.length ? (
        <ul className="fin-list">
          {account.history.map((entry) => (
            <li key={entry.id}>
              <span>
                {shortDate(entry.date)} · <b>{money(entry.balance)}</b>
                {entry.notes ? <small className="muted"> · {entry.notes}</small> : null}
              </span>
              <button type="button" className="ghost tiny" onClick={() => removeEntry(entry)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <div className="notice">{error}</div> : null}
      <footer className="fin-actions">
        <span className="spacer" />
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
        <button type="submit" className="primary" disabled={form.balance === ''}>
          Save balance
        </button>
      </footer>
    </Modal>
  )
}

function Position({ label, value, others, comparisons, better = 'up' }) {
  return (
    <div className="kpi-card size-md">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value == null ? '—' : money(value)}</strong>
      <div className="kpi-rows">
        {comparisons.map(({ name, label: compareLabel }) => {
          const other = others?.[name]
          const change = formatChange('currency', value, other)
          return (
            <div key={name} className="kpi-row" title={`End of ${compareLabel}`}>
              <RowName name={name} label={compareLabel} />
              <span className="kpi-row-value">{other == null ? '—' : money(other)}</span>
              <span className={`kpi-delta ${change ? tone(change.diff, better) : 'flat'}`}>{change ? change.text.split(' / ')[0] : 'n/a'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FinanceCash() {
  const meta = useMeta()
  const { data, error } = useInsights('/api/financials/cash/')
  const comparisons = useComparisons(data)
  const { reload } = usePeriod()
  const [editing, setEditing] = useState(null)
  const [updating, setUpdating] = useState(null)
  const totals = data?.totals || {}
  const pick = (key) => Object.fromEntries(comparisons.map(({ name }) => [name, totals[name]?.[key]]))
  const done = () => {
    setEditing(null)
    setUpdating(null)
    reload()
  }

  const table = (title, rows, subtitle) => (
    <Panel title={title} subtitle={subtitle}>
      <div className="drill-table-wrap">
        <table className="drill-table fin-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Type</th>
              <th className="k-currency">At end of period</th>
              <th>As of</th>
              {comparisons.map(({ name, label }) => (
                <th key={name} className="k-currency">
                  {label}
                </th>
              ))}
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((acc) => (
              <tr key={acc.id}>
                <td>
                  <button type="button" className="link" onClick={() => setEditing(acc)}>
                    {acc.name}
                  </button>
                  {acc.institution ? <small className="muted"> · {acc.institution}</small> : null}
                </td>
                <td>{acc.kind_label}</td>
                <td className="k-currency">
                  <strong>{acc.balance == null ? '—' : money(acc.balance)}</strong>
                </td>
                <td className="muted">{acc.balance_date ? shortDate(acc.balance_date) : 'No balance yet'}</td>
                {comparisons.map(({ name }) => (
                  <td key={name} className="k-currency">
                    {acc[name] == null ? '—' : money(acc[name])}
                  </td>
                ))}
                <td>
                  <button type="button" className="ghost tiny" onClick={() => setUpdating(acc)}>
                    Update balance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="muted empty">None yet.</p> : null}
      </div>
    </Panel>
  )

  return (
    <FinanceShell
      data={data}
      error={error}
      actions={
        <button type="button" className="primary" onClick={() => setEditing('new')}>
          + Add account
        </button>
      }
    >
      <div className="kpi-grid" style={{ '--kpi-cols': 4 }}>
        <Position label="Opening cash" value={totals.opening?.cash} comparisons={[]} />
        <Position label="Closing cash" value={totals.balance?.cash} others={pick('cash')} comparisons={comparisons} />
        <Position label="Debt (cards, loans, lines of credit)" value={totals.balance?.debt} others={pick('debt')} comparisons={comparisons} better="down" />
        <Position label="Net position (cash − debt)" value={totals.balance?.net} others={pick('net')} comparisons={comparisons} />
      </div>
      <p className="period-note muted">
        Closing balances are the latest ones entered on or before the end of each period, and opening cash is the same on the day before it starts. Update them at
        least once a month (Month review reminds you).
        {data?.opening_missing ? ` ${data.opening_missing} bank account${data.opening_missing === 1 ? ' has' : 's have'} no balance from before this period, so opening cash leaves ${data.opening_missing === 1 ? 'it' : 'them'} out.` : ''}
      </p>
      {table(
        'Bank accounts',
        (data?.accounts || []).filter((a) => !a.is_debt),
      )}
      {table(
        'Credit cards, loans & lines of credit',
        (data?.accounts || []).filter((a) => a.is_debt),
        'Amounts owed.',
      )}
      <Panel
        title="Cash flow (estimate)"
        subtitle="Money in = payments received in Jobber. Money out = paid expenses in Financials (with tax). Compare with the change in your bank balances above."
      >
        <KpiGrid kpis={data?.cash_flow} comparisons={comparisons} size="sm" />
      </Panel>
      <Panel title="Interest, principal & other money movements" subtitle="From expenses in the “Other financial transactions” group, this period.">
        {data?.transactions?.length ? (
          <BreakdownTable rows={data.transactions} comparisons={comparisons} mode="amount" firstColumn="Transaction" />
        ) : (
          <p className="muted">None entered for this period.</p>
        )}
      </Panel>
      {editing ? <AccountForm meta={meta} account={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={done} /> : null}
      {updating ? <BalanceForm account={updating} onClose={() => setUpdating(null)} onSaved={done} /> : null}
    </FinanceShell>
  )
}

// ——— Month review ———
function Hint({ ok, children }) {
  return <li className={ok ? 'ok' : 'warn'}>{children}</li>
}

function ReviewMonth({ meta, month, onChanged }) {
  const { version } = usePeriod()
  const { data, error } = useFetch(`/api/financials/reviews/${month}/`, version)
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const review = data?.review
  const checks = draft?.checks || review?.checks || {}
  const notes = draft?.notes ?? review?.notes ?? ''
  const reviewed = review?.status === 'reviewed'
  const hints = review?.hints
  const ended = month < monthIso()

  async function save(action = '') {
    setMessage('')
    try {
      await send(`/api/financials/reviews/${month}/${action ? `${action}/` : ''}`, { method: action ? 'POST' : 'PATCH', body: { checks, notes } })
      setDraft(null)
      onChanged()
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (error) return <div className="notice">{error}</div>
  if (!review) return <SkeletonPage />
  return (
    <Panel
      title={review.label}
      subtitle={
        reviewed
          ? `Reviewed by ${review.reviewed_by || '—'} on ${when(review.reviewed_at)}. Changes to this month are locked.`
          : 'Tick each item once it’s done, then mark the month as reviewed.'
      }
    >
      <ul className="fin-hints">
        <Hint ok={hints.pending_recurring === 0}>
          {hints.pending_recurring ? `${hints.pending_recurring} recurring charge(s) still waiting to be verified` : 'All recurring charges verified'}
        </Hint>
        <Hint ok={hints.pay_runs > 0}>{hints.pay_runs ? `${hints.pay_runs} pay run(s) entered` : 'No pay runs entered for this month'}</Hint>
        <Hint ok={hints.missing_receipts === 0}>
          {hints.missing_receipts ? `${hints.missing_receipts} expense(s) without a receipt` : 'Every expense has a receipt'}
        </Hint>
        <Hint ok={hints.unpaid === 0}>{hints.unpaid ? `${hints.unpaid} expense(s) still unpaid` : 'No unpaid expenses'}</Hint>
        <Hint ok={!hints.accounts_without_balance.length}>
          {hints.accounts_without_balance.length
            ? `No balance this month for: ${hints.accounts_without_balance.join(', ')}`
            : 'Every account has a balance this month'}
        </Hint>
        <Hint ok={!hints.totals_with_difference}>
          {hints.totals_with_difference
            ? `${hints.totals_with_difference} monthly total(s) differ from the individual expenses`
            : 'Monthly totals match (or none entered)'}
        </Hint>
        <li className="muted">
          {hints.expenses} expenses · {money(hints.expenses_total)} before tax
        </li>
      </ul>
      <div className="fin-checklist">
        {(meta?.review_checks || []).map((item) => (
          <label key={item.key} className="fin-check">
            <input
              type="checkbox"
              disabled={reviewed}
              checked={Boolean(checks[item.key])}
              onChange={(e) =>
                setDraft({
                  checks: { ...checks, [item.key]: e.target.checked },
                  notes,
                })
              }
            />
            {item.label}
          </label>
        ))}
      </div>
      <Field label="Notes" wide>
        <textarea rows={2} disabled={reviewed} value={notes} onChange={(e) => setDraft({ checks, notes: e.target.value })} />
      </Field>
      {message ? <div className="notice">{message}</div> : null}
      <div className="fin-actions">
        {reviewed ? (
          atLeast(meta?.role, 'admin') ? (
            <button type="button" className="ghost" onClick={() => save('reopen')}>
              Reopen month
            </button>
          ) : (
            <span className="muted">Ask a Financials admin to reopen it.</span>
          )
        ) : (
          <>
            <button type="button" className="ghost" onClick={() => save()} disabled={!draft}>
              Save progress
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => save('close')}
              disabled={!ended || !Object.values(checks).every(Boolean) || !Object.keys(checks).length}
            >
              Mark month as reviewed
            </button>
            {!ended ? <span className="muted tiny-text">You can mark it reviewed once the month has ended.</span> : null}
          </>
        )}
      </div>
    </Panel>
  )
}

export function FinanceReview() {
  const meta = useMeta()
  const { version, reload } = usePeriod()
  const { data, error } = useFetch('/api/financials/reviews/', version)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    now.setDate(1)
    now.setMonth(now.getMonth() - 1)
    return monthIso(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  })
  return (
    <div className="master finance">
      {error ? <div className="notice">{error}</div> : null}
      <div className="fin-months">
        {(data?.months || []).map((m) => {
          const key = monthIso(m.month)
          return (
            <button key={key} type="button" className={`fin-month${key === month ? ' active' : ''} ${m.status}`} onClick={() => setMonth(key)}>
              <span>{monthName(m.month)}</span>
              <small>{m.status === 'reviewed' ? '✓ Reviewed' : 'Open'}</small>
            </button>
          )
        })}
      </div>
      <ReviewMonth key={month} meta={meta} month={month} onChanged={reload} />
    </div>
  )
}
