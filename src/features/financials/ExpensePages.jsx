import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { money, number, queryString } from '../../lib'
import { KpiGrid } from '../master/KpiCard'
import { TrendPanel } from '../master/MasterCharts'
import { BreakdownTable, Panel } from '../master/MasterPages'
import { monthName, shortDate } from '../master/format'
import { useComparisons, useFetch, useInsights, usePeriod } from '../master/periodState'
import { ExpenseForm } from './ExpenseForm'
import { atLeast, download, openReceipt, useDrill, useMeta } from './financeApi'
import { CategorySelect, Choice, FinanceShell, Pager } from './FinanceParts'

function GroupBars({ groups = [] }) {
  const max = Math.max(...groups.map((g) => Number(g.current || 0)), 1)
  return (
    <ul className="fin-bars">
      {groups.map((g) => (
        <li key={g.key}>
          <span>{g.label}</span>
          <i style={{ '--w': `${(Number(g.current || 0) / max) * 100}%` }} className={`b-${g.key}`} />
          <b>{money(g.current)}</b>
        </li>
      ))}
    </ul>
  )
}

/** Shown on top of Financials pages: charges to verify and months not reviewed yet. */
export function FinanceAlerts({ pending, unreviewed }) {
  const navigate = useNavigate()
  if (!pending?.count && !unreviewed?.length) return null
  return (
    <div className="fin-alerts">
      {pending?.count ? (
        <button type="button" className="fin-alert" onClick={() => navigate('/financials/recurring')}>
          <b>{pending.count}</b> recurring charge
          {pending.count === 1 ? '' : 's'} ({money(pending.total)}) waiting to be verified →
        </button>
      ) : null}
      {unreviewed?.length ? (
        <button type="button" className="fin-alert soft" onClick={() => navigate('/financials/review')}>
          Not reviewed yet: {unreviewed.map((m) => monthName(m)).join(', ')} →
        </button>
      ) : null}
    </div>
  )
}

// ——— Expenses dashboard ———
export function FinanceExpenses() {
  const { data, error } = useInsights('/api/financials/summary/')
  const comparisons = useComparisons(data)
  const meta = useMeta()
  const { reload } = usePeriod()
  const [drill, openDrill, closeDrill] = useDrill()
  const [adding, setAdding] = useState(false)
  const counted = (data?.categories || []).filter((row) => row.part !== 'excluded')
  const excluded = (data?.categories || []).filter((row) => row.part === 'excluded')
  const addButton = (
    <button type="button" className="primary" onClick={() => setAdding(true)}>
      + Add expense
    </button>
  )
  return (
    <FinanceShell data={data} error={error} drill={drill} onCloseDrill={closeDrill} actions={addButton}>
      <FinanceAlerts pending={data?.pending} unreviewed={data?.unreviewed} />
      {data && !data.data_start ? (
        <div className="fin-empty">
          <h3>No expenses yet</h3>
          <p className="muted">Add expenses one by one, enter pay runs, set up recurring expenses, or import a CSV / Excel file.</p>
        </div>
      ) : null}
      <KpiGrid kpis={data?.cards} comparisons={comparisons} onDrill={openDrill} />
      <div className="master-grid">
        <Panel title="By group" subtitle="Before tax. Click a card above to see the expenses behind it." className="span-5">
          <GroupBars groups={(data?.groups || []).filter((g) => g.key !== 'other')} />
          {data?.groups?.find((g) => g.key === 'other')?.current ? (
            <p className="muted tiny-text">Interest & financing costs: {money(data.groups.find((g) => g.key === 'other').current)}</p>
          ) : null}
        </Panel>
        <Panel title="By division" subtitle="Shared = costs for the whole company (rent, office payroll…)." className="span-7">
          <BreakdownTable rows={data?.divisions} comparisons={comparisons} mode="amount" firstColumn="Division" />
        </Panel>
        <Panel title="By category" subtitle="Share is of total expenses." className="span-12">
          <BreakdownTable rows={counted} comparisons={comparisons} mode="amount" firstColumn="Category" />
        </Panel>
        {excluded.length ? (
          <Panel
            title="Not counted as expenses"
            subtitle="Loan principal, credit card payments, transfers, equipment purchases and tax remittances move money but aren't costs."
            className="span-12"
          >
            <BreakdownTable rows={excluded} comparisons={comparisons} mode="amount" firstColumn="Transaction" />
          </Panel>
        ) : null}
      </div>
      <TrendPanel
        title="Expense trend"
        metrics={[
          { key: 'total_expenses', label: 'Total expenses' },
          { key: 'cogs', label: 'COGS' },
          { key: 'operating_expenses', label: 'Operating expenses' },
          { key: 'cogs_pct', label: 'COGS %' },
          { key: 'opex_pct', label: 'Operating expenses %' },
          { key: 'labour_cost_pct', label: 'Labour cost %' },
          { key: 'expenses_pct', label: 'Expenses % of revenue' },
        ]}
      />
      {adding ? (
        <ExpenseForm
          meta={meta}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            reload()
          }}
        />
      ) : null}
    </FinanceShell>
  )
}

// ——— Expense entries ———
const SOURCES = [
  { key: 'manual', label: 'Entered by hand' },
  { key: 'import', label: 'Imported' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'payroll', label: 'Pay runs' },
  { key: 'hub', label: 'Contractor pay (Hub)' },
]

export function FinanceEntries() {
  const meta = useMeta()
  const { params, version, reload } = usePeriod()
  const [filters, setFilters] = useState({
    q: '',
    group: '',
    category: '',
    division: '',
    status: '',
    receipt: '',
    source: '',
  })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const full = atLeast(meta?.role, 'full')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.q.trim()), 250)
    return () => clearTimeout(timer)
  }, [filters.q])

  const query = { ...params, division: undefined, ...filters, q: search }
  const { data, error } = useFetch(`/api/financials/expenses/${queryString({ ...query, page })}`, version)
  const setFilter = (key) => (value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value?.target ? value.target.value : value,
    }))
    setPage(1)
  }
  const saved = () => {
    setEditing(null)
    reload()
  }

  return (
    <FinanceShell
      data={data}
      error={error}
      compareNote={false}
      actions={
        <button type="button" className="primary" onClick={() => setEditing('new')}>
          + Add expense
        </button>
      }
    >
      <Panel
        title="Expenses"
        subtitle={full ? 'All expenses in this period. Click a row to edit it.' : 'The expenses you entered in this period. Click a row to correct it.'}
        actions={
          <button
            type="button"
            className="ghost tiny"
            onClick={() => download(`/api/financials/expenses/export/${queryString(query)}`, 'expenses.csv').catch((err) => window.alert(err.message))}
          >
            Download CSV
          </button>
        }
      >
        <div className="fin-filters">
          <input placeholder="Search vendor, description, notes" value={filters.q} onChange={setFilter('q')} />
          {full ? <Choice options={meta?.groups} value={filters.group} onChange={setFilter('group')} empty="All groups" /> : null}
          <CategorySelect meta={meta} value={filters.category} onChange={setFilter('category')} placeholder="All categories" allowEmpty includeInactive />
          <Choice options={meta?.divisions} value={filters.division} onChange={setFilter('division')} empty="All divisions" />
          <Choice options={meta?.statuses} value={filters.status} onChange={setFilter('status')} empty="Paid + unpaid" />
          <Choice
            options={[
              { key: 'missing', label: 'No receipt' },
              { key: 'attached', label: 'Receipt attached' },
            ]}
            value={filters.receipt}
            onChange={setFilter('receipt')}
            empty="Any receipt"
          />
          {full ? <Choice options={SOURCES} value={filters.source} onChange={setFilter('source')} empty="Any source" /> : null}
        </div>
        <div className="drill-table-wrap">
          <table className="drill-table fin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor / description</th>
                <th>Category</th>
                <th>Division</th>
                <th className="k-currency">Before tax</th>
                <th className="k-currency">GST + QST</th>
                <th className="k-currency">Total</th>
                <th>Status</th>
                <th aria-label="Receipt" />
              </tr>
            </thead>
            <tbody>
              {(data?.results || []).map((row) => (
                <tr key={row.id} className="clickable" onClick={() => setEditing(row)}>
                  <td>{shortDate(row.date)}</td>
                  <td>
                    <strong>{row.vendor || '—'}</strong>
                    {row.description ? <small className="muted"> · {row.description}</small> : null}
                    {row.pending_verification ? <span className="fin-tag warn">To verify</span> : null}
                    {row.source !== 'manual' ? <span className="fin-tag">{row.source_label}</span> : null}
                    {row.contractor_pay_warning ? (
                      <span className="fin-tag warn" title={row.contractor_pay_warning}>
                        Possible duplicate
                      </span>
                    ) : null}
                  </td>
                  <td>
                    {row.category}
                    {row.subcategory ? <small className="muted"> › {row.subcategory}</small> : null}
                  </td>
                  <td>{row.division_label}</td>
                  <td className="k-currency">{money(row.amount)}</td>
                  <td className="k-currency">{money(Number(row.gst) + Number(row.qst))}</td>
                  <td className="k-currency">{money(row.total)}</td>
                  <td>
                    <span className={`status-pill ${row.status === 'paid' ? 's-active' : 's-paused'}`}>{row.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                  </td>
                  <td>
                    {row.has_receipt ? (
                      <button
                        type="button"
                        className="ghost tiny"
                        title="View receipt"
                        onClick={(e) => {
                          e.stopPropagation()
                          openReceipt(`/api/financials/expenses/${row.id}/receipt/`)
                        }}
                      >
                        📎
                      </button>
                    ) : row.pay_run_id || row.automatic ? null : (
                      <span className="muted tiny-text" title="No receipt attached">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {data?.sums ? (
              <tfoot>
                <tr className="total">
                  <td colSpan={4}>
                    Total · {number(data.count)} expense
                    {data.count === 1 ? '' : 's'}
                  </td>
                  <td className="k-currency">{money(data.sums.amount)}</td>
                  <td className="k-currency">{money(Number(data.sums.gst) + Number(data.sums.qst))}</td>
                  <td className="k-currency">{money(data.sums.total)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            ) : null}
          </table>
          {data && !data.results.length ? <p className="muted empty">No expenses match.</p> : null}
          {data?.sums ? (
            <p className="muted tiny-text fin-note">
              Total of the listed expenses, leaving out recurring charges not verified yet. The Expenses page can differ: it counts amounts before tax, leaves
              out loan principal, transfers and similar, and uses a monthly total instead of the individual expenses where one is entered.
            </p>
          ) : null}
        </div>
        <Pager data={data} page={page} setPage={setPage} noun="expenses" />
      </Panel>
      {editing ? (
        <ExpenseForm
          meta={meta}
          expense={editing === 'new' ? null : editing}
          mode={editing === 'new' ? 'create' : editing.pending_verification ? 'verify' : 'edit'}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      ) : null}
    </FinanceShell>
  )
}
