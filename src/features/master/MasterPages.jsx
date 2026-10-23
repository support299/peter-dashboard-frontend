import { useCallback, useEffect, useState } from 'react'
import { money, number, queryString } from '../../lib'
import { STATUS_LABELS } from './constants'
import { DrillModal } from './DrillModal'
import { formatChange, formatValue, shortDate, tone } from './format'
import { KpiCard, KpiGrid } from './KpiCard'
import { TrendPanel, Waterfall } from './MasterCharts'
import { PeriodBar } from './PeriodBar'
import { useComparisons, useFetch, useInsights, usePeriod } from './periodState'
import { PlanEditor } from './PlanEditor'
import { ReasonEditor } from './ReasonEditor'
import './master.css'

/** Period bar + loading/error + drill-down modal shared by every Master page. */
function useMasterPage(path) {
  const result = useInsights(path)
  const { reload } = usePeriod()
  const [drill, setDrill] = useState(null)
  const openDrill = useCallback((metric, title, extra = {}) => setDrill({ metric, title, ...extra }), [])
  const comparisons = useComparisons(result.data)
  const shell = (children) => (
    <div className="master">
      <PeriodBar info={result.data} />
      {result.error ? <div className="notice">{result.error}</div> : null}
      {result.data && comparisons.length ? (
        <p className="period-note muted">
          Comparing with{' '}
          {comparisons.map(({ name, label }, index) => (
            <span key={name}>
              {index ? ' and ' : ''}
              <b>{name === 'previous' ? 'prev. period' : 'last year'}</b> ({label})
            </span>
          ))}
          .{result.data.period?.partial ? ' This period is still in progress, so each comparison covers the same number of days.' : ''}
        </p>
      ) : null}
      {!result.data && !result.error ? <p className="muted">Loading…</p> : null}
      {result.data ? children : null}
      {drill ? <DrillModal request={drill} onClose={() => setDrill(null)} onChanged={reload} /> : null}
    </div>
  )
  return { ...result, openDrill, comparisons, shell }
}

function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <article className={`master-panel ${className}`}>
      <header className="master-panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </article>
  )
}

// ——— Level 1: CEO view ———
export function MasterOverview() {
  const { data, openDrill, comparisons, shell } = useMasterPage('/api/insights/overview/')
  const { state } = usePeriod()
  const changes = data?.what_changed?.items || []
  const against = data?.comparisons?.[data?.what_changed?.against]
  return shell(
    <>
      <section className="scorecard">
        <KpiGrid kpis={data?.scorecard} comparisons={comparisons} onDrill={openDrill} size="lg" />
      </section>
      <div className="master-grid">
        <Panel
          title={`What changed – ${data?.period?.label || ''}`}
          subtitle={against ? `Biggest moves compared with ${against.label}` : null}
          className="span-5"
        >
          {changes.length ? (
            <ul className="changes">
              {changes.map((item) => {
                const change = formatChange(item.kind, item.current, item.comparison)
                return (
                  <li key={item.key}>
                    <button type="button" className={`change ${item.good ? 'good' : 'bad'}`} onClick={() => item.drill && openDrill(item.drill, item.label)} disabled={!item.drill}>
                      <span className="change-arrow">{item.direction === 'up' ? '↑' : '↓'}</span>
                      <span className="change-label">{item.label}</span>
                      <b>{change?.text}</b>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">No big changes this period.</p>
          )}
          {state.compare === 'last_year' ? null : (
            <p className="muted tiny-text">Tip: choose “Same period last year” above to rank changes against last year.</p>
          )}
        </Panel>
        <div className="span-7">
          <TrendPanel
            title="Long-term trend"
            metrics={[
              { key: 'revenue', label: 'Revenue' },
              { key: 'mrr', label: 'MRR' },
              { key: 'active_recurring_clients', label: 'Active recurring clients' },
              { key: 'visits_completed', label: 'Completed visits' },
              { key: 'avg_revenue_per_visit', label: 'Avg revenue per visit' },
              { key: 'new_clients', label: 'New clients' },
              { key: 'gross_profit', label: 'Gross profit' },
              { key: 'net_profit', label: 'Net profit' },
              { key: 'payroll_pct', label: 'Payroll %' },
            ]}
          />
        </div>
      </div>
    </>,
  )
}

// ——— Revenue & profitability ———
function BreakdownTable({ rows = [], comparisons, mode, onRow }) {
  const total = rows.reduce((sum, row) => sum + Number(row.current || 0), 0)
  const show = (value, all) => (mode === 'pct' ? (all ? `${((Number(value || 0) / all) * 100).toFixed(1)}%` : '—') : money(value))
  const totals = Object.fromEntries(comparisons.map(({ name }) => [name, rows.reduce((s, r) => s + Number(r[name] || 0), 0)]))
  return (
    <table className="breakdown">
      <thead>
        <tr>
          <th>Line</th>
          <th className="num">This period</th>
          {comparisons.map(({ name, label }) => (
            <th key={name} className="num">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} onClick={() => onRow?.(row)} className={onRow ? 'clickable' : ''}>
            <td>{row.label}</td>
            <td className="num strong">{show(row.current, total)}</td>
            {comparisons.map(({ name }) => {
              const change = mode === 'pct' ? null : formatChange('currency', row.current, row[name])
              return (
                <td key={name} className="num">
                  {row[name] == null ? 'n/a' : show(row[name], totals[name])}
                  {change && row[name] ? <small className={tone('up', change.diff)}> {change.text.split(' / ')[1] || ''}</small> : null}
                </td>
              )
            })}
          </tr>
        ))}
        <tr className="total">
          <td>Total</td>
          <td className="num strong">{mode === 'pct' ? '100%' : money(total)}</td>
          {comparisons.map(({ name }) => (
            <td key={name} className="num">
              {mode === 'pct' ? '100%' : money(totals[name])}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

export function MasterRevenue() {
  const { data, openDrill, comparisons, shell } = useMasterPage('/api/insights/revenue/')
  const [mode, setMode] = useState('amount')
  const toggle = (
    <div className="seg">
      <button type="button" className={mode === 'amount' ? 'active' : ''} onClick={() => setMode('amount')}>
        $
      </button>
      <button type="button" className={mode === 'pct' ? 'active' : ''} onClick={() => setMode('pct')}>
        % of total
      </button>
    </div>
  )
  return shell(
    <>
      <KpiGrid kpis={data?.cards} comparisons={comparisons} onDrill={openDrill} />
      <div className="master-grid">
        <Panel title="Revenue by type" subtitle="Net of discounts, before tax. Click a line to see its invoices." actions={toggle} className="span-7">
          <BreakdownTable rows={data?.categories} comparisons={comparisons} mode={mode} onRow={(row) => openDrill('revenue', `Revenue · ${row.label}`, { category: row.key })} />
        </Panel>
        <Panel title="Revenue by division" subtitle="All four divisions add up to company revenue." className="span-5">
          <BreakdownTable rows={data?.divisions} comparisons={comparisons} mode={mode} />
        </Panel>
        <Panel title="Profitability" subtitle="Profit lines appear once expenses and payroll are entered in Financials." className="span-12">
          <KpiGrid kpis={data?.profitability} comparisons={comparisons} onDrill={openDrill} size="sm" />
        </Panel>
        <Panel title="Customer concentration" subtitle="How much revenue depends on the biggest clients." className="span-7">
          <KpiGrid kpis={data?.concentration} comparisons={comparisons} onDrill={openDrill} size="sm" columns={2} />
          <table className="breakdown compact">
            <tbody>
              {(data?.top_clients || []).map((row, index) => (
                <tr key={row.client_id ?? index}>
                  <td>
                    {index + 1}. {row.client}
                  </td>
                  <td className="num">{money(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Receivables" subtitle="Unpaid invoices right now (no history to compare)." className="span-5">
          <KpiGrid kpis={data?.receivables} comparisons={[]} onDrill={openDrill} size="sm" columns={1} />
        </Panel>
      </div>
      <TrendPanel title="Revenue trend" metrics={[{ key: 'revenue', label: 'Revenue' }, { key: 'avg_revenue_per_visit', label: 'Avg revenue per visit' }, { key: 'gross_profit', label: 'Gross profit' }, { key: 'net_profit', label: 'Net profit' }]} />
    </>,
  )
}

// ——— Clients & recurring growth ———
export function MasterClients() {
  const { data, openDrill, comparisons, shell } = useMasterPage('/api/insights/clients/')
  const growth = Object.fromEntries((data?.growth || []).map((k) => [k.key, k]))
  const card = (key) => (growth[key] ? <KpiCard kpi={growth[key]} comparisons={comparisons} onDrill={openDrill} /> : null)
  return shell(
    <>
      <Panel title="Client growth" subtitle="Active = completed visit in the last 90 days or a booking coming up.">
        <div className="formula">
          {card('active_clients_start')}
          <span className="op">+</span>
          {card('new_clients')}
          <span className="op">+</span>
          {card('returning_clients')}
          <span className="op">−</span>
          {card('lost_clients')}
          <span className="op">=</span>
          {card('active_clients')}
        </div>
        <div className="formula-foot">{card('net_client_growth')}</div>
      </Panel>
      <Panel title="Recurring clients & jobs" subtitle="From Jobber recurring jobs. Paused clients still count as recurring clients.">
        <KpiGrid kpis={data?.recurring} comparisons={comparisons} onDrill={openDrill} />
      </Panel>
      <Panel title="Sales funnel" subtitle="Leads → Quotes → Accepted → First clean → Recurring.">
        <KpiGrid kpis={data?.sales} comparisons={comparisons} onDrill={openDrill} size="sm" />
      </Panel>
      <TrendPanel
        title="Client trend"
        metrics={[
          { key: 'active_recurring_clients', label: 'Active recurring clients' },
          { key: 'new_clients', label: 'New clients' },
        ]}
      />
    </>,
  )
}

// ——— MRR ———
function PlansTable({ onEdit, version }) {
  const { state } = usePeriod()
  const [status, setStatus] = useState('current')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(q.trim()), 250)
    return () => clearTimeout(timer)
  }, [q])

  const { data } = useFetch(`/api/insights/mrr/plans/${queryString({ status, q: search, page, division: state.division })}`, version)

  return (
    <Panel
      title="Recurring plans"
      subtitle="One row per Jobber recurring job. Use Edit to mark a pause or correct MRR."
      actions={
        <div className="trend-controls">
          <input placeholder="Search client" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Status">
            <option value="current">Active + paused</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="scheduled_resume">Scheduled to resume</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_price">No price in Jobber</option>
          </select>
        </div>
      }
    >
      <div className="drill-table-wrap">
        <table className="drill-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Frequency</th>
              <th className="k-currency">Price</th>
              <th>Priced from</th>
              <th className="k-currency">MRR</th>
              <th>Status</th>
              <th>Since</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {(data?.results || []).map((plan) => (
              <tr key={plan.id}>
                <td>
                  {plan.link ? (
                    <a href={plan.link} target="_blank" rel="noreferrer">
                      {plan.client}
                    </a>
                  ) : (
                    plan.client
                  )}
                  {plan.manual_monthly_value != null ? <small className="muted"> · corrected</small> : null}
                </td>
                <td>{plan.frequency}</td>
                <td className="k-currency">{money(plan.visit_value)}</td>
                <td>
                  <span className={`price-source p-${plan.pricing_source}`}>{plan.pricing_label}</span>
                </td>
                <td className="k-currency">{money(plan.monthly_value)}</td>
                <td>
                  <span className={`status-pill s-${plan.status}`}>{STATUS_LABELS[plan.status]}</span>
                  {plan.expected_return ? <small className="muted"> back {shortDate(plan.expected_return)}</small> : null}
                </td>
                <td>{shortDate(plan.start_date)}</td>
                <td>
                  <button type="button" className="ghost tiny" onClick={() => onEdit(plan)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.pages > 1 ? (
        <div className="pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ‹
          </button>
          <span>
            Page {data.page} of {data.pages} · {number(data.count)} plans
          </span>
          <button type="button" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            ›
          </button>
        </div>
      ) : null}
    </Panel>
  )
}

export function MasterMrr() {
  const { data, openDrill, comparisons, shell } = useMasterPage('/api/insights/mrr/')
  const { reload, version } = usePeriod()
  const [editing, setEditing] = useState(null)
  return shell(
    <>
      <Panel
        title="MRR waterfall"
        subtitle={
          data?.expansion_tracked_from
            ? `Price and frequency changes (expansion / contraction) are tracked from ${shortDate(data.expansion_tracked_from)}. Click a bar to see the clients.`
            : 'Click a bar to see the clients behind it.'
        }
      >
        <Waterfall steps={data?.waterfall} onSelect={(bar) => openDrill(bar.key, bar.label)} />
      </Panel>
      <KpiGrid kpis={data?.cards} comparisons={comparisons} onDrill={openDrill} />
      <PlansTable onEdit={setEditing} version={version} />
      <TrendPanel title="MRR trend" metrics={[{ key: 'mrr', label: 'MRR' }, { key: 'active_recurring_clients', label: 'Active recurring clients' }]} />
      {editing ? (
        <PlanEditor
          plan={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      ) : null}
    </>,
  )
}

// ——— Cancellations ———
export function MasterCancellations() {
  const { data, openDrill, comparisons, shell } = useMasterPage('/api/insights/cancellations/')
  const { reload } = usePeriod()
  const groups = data?.groups || []
  const groupTotal = groups.reduce((s, g) => s + g.count, 0)
  return shell(
    <>
      {data?.data_start ? (
        <p className="period-note muted">Cancellation records start on {shortDate(data.data_start)}. Earlier periods show as unavailable.</p>
      ) : null}
      <KpiGrid kpis={data?.cards} comparisons={comparisons} onDrill={openDrill} />
      <div className="master-grid">
        <Panel title="Who caused it" subtitle="Based on the reason chosen for each cancelled visit." className="span-5">
          {groupTotal ? (
            <div className="stack-bar">
              {groups.map((g) => (
                <span key={g.key} className={`g-${g.key || 'none'}`} style={{ flex: g.count || 0 }} title={`${g.label}: ${g.count}`} />
              ))}
            </div>
          ) : null}
          <ul className="legend">
            {groups.map((g) => (
              <li key={g.key}>
                <i className={`g-${g.key || 'none'}`} /> {g.label} <b>{number(g.count)}</b> <span className="muted">{money(g.value)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Cancellation reasons" subtitle="Cancelled visits by reason." className="span-7">
          <table className="breakdown">
            <thead>
              <tr>
                <th>Reason</th>
                <th className="num">Visits</th>
                <th className="num">Value</th>
                {comparisons.map(({ name, label }) => (
                  <th key={name} className="num">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.reasons || []).filter((r) => r.count || comparisons.some(({ name }) => r[name])).map((row) => (
                <tr key={row.key || 'none'}>
                  <td>{row.label}</td>
                  <td className="num strong">{number(row.count)}</td>
                  <td className="num">{money(row.value)}</td>
                  {comparisons.map(({ name }) => (
                    <td key={name} className="num">
                      {row[name] == null ? 'n/a' : number(row[name])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
      <Panel title="Cancellations this period" subtitle="Pick a reason for each one. It saves straight away.">
        <div className="drill-table-wrap">
          <table className="drill-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Client</th>
                <th>Division</th>
                <th className="k-currency">Value</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {(data?.records || []).map((row) => (
                <tr key={row.id}>
                  <td>{shortDate(row.date)}</td>
                  <td>{row.type}</td>
                  <td>{row.client}</td>
                  <td>{row.division}</td>
                  <td className="k-currency">{formatValue('currency', row.value)}</td>
                  <td>
                    <ReasonEditor record={row} onSaved={reload} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.records.length ? <p className="muted empty">No cancellations in this period.</p> : null}
        </div>
      </Panel>
      <Panel title="Why recurring clients cancel" subtitle="From the Hub's Service Cancellation Form, by date submitted.">
        {data?.service_reasons?.length ? (
          <table className="breakdown">
            <tbody>
              {data.service_reasons.map((row) => (
                <tr key={row.label} className="clickable" onClick={() => openDrill('service_cancellations', 'Service cancellation forms')}>
                  <td>
                    <strong>{row.label}</strong>
                    {row.details.length ? (
                      <small className="muted"> · {row.details.map((d) => `${d.label} (${d.count})`).join(', ')}</small>
                    ) : null}
                  </td>
                  <td className="num strong">{number(row.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No cancellation forms this period.</p>
        )}
      </Panel>
      <TrendPanel title="Cancellation trend" metrics={[{ key: 'cancelled_visits_value', label: 'Value of cancelled visits' }]} />
    </>,
  )
}

// ——— Quality ———
export function MasterQuality() {
  const { data, openDrill, comparisons, shell } = useMasterPage('/api/insights/quality/')
  return shell(
    <>
      <Panel title="Touch-ups / redos" subtitle="Visits with “Touch-up” or “Touch up” in the Jobber title. Rate per 100 completed visits.">
        <KpiGrid kpis={data?.redos} comparisons={comparisons} onDrill={openDrill} columns={2} />
      </Panel>
      <Panel title="Hub feedback" subtitle="“How are we doing?” and “Review your recent experience!” forms. Participation = responses per completed visit.">
        <KpiGrid kpis={data?.feedback} comparisons={comparisons} onDrill={openDrill} size="sm" />
      </Panel>
      <div className="master-grid">
        <Panel title="Complaints" subtitle="From the Hub complaint form. Counted on the incident date." className="span-7">
          <KpiGrid kpis={data?.complaints} comparisons={comparisons} onDrill={openDrill} size="sm" columns={2} />
        </Panel>
        <Panel title="Complaint types" subtitle="This period." className="span-5">
          {data?.complaint_types?.length ? (
            <table className="breakdown">
              <tbody>
                {data.complaint_types.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td className="num strong">{number(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No complaints this period.</p>
          )}
        </Panel>
      </div>
      <Panel title="Google reviews" subtitle="Collected by the Hub through UMB / GoHighLevel. Rating and total are all-time up to the end of the period.">
        <KpiGrid kpis={data?.google} comparisons={comparisons} onDrill={openDrill} size="sm" />
      </Panel>
      <EmployeeTable title="By cleaner" subtitle="Hub reviews they were on and complaints they were responsible for, this period." rows={data?.people} />
      <TrendPanel
        title="Quality trend"
        metrics={[
          { key: 'touch_ups', label: 'Touch-up visits' },
          { key: 'complaints', label: 'Complaints' },
          { key: 'feedback_score', label: 'Hub feedback score' },
          { key: 'google_new_reviews', label: 'New Google reviews' },
        ]}
      />
    </>,
  )
}

function EmployeeTable({ title, subtitle, rows = [] }) {
  return (
    <Panel title={title} subtitle={subtitle}>
      {rows.length ? (
        <div className="drill-table-wrap">
          <table className="drill-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="k-count">Hours</th>
                <th className="k-count">Overtime</th>
                <th className="k-count">Reviews</th>
                <th className="k-count">Avg rating</th>
                <th className="k-count">Complaints</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.employee}>
                  <td>{row.employee}</td>
                  <td className="k-count">{Number(row.hours).toFixed(2)}</td>
                  <td className="k-count">{Number(row.overtime).toFixed(2)}</td>
                  <td className="k-count">{number(row.reviews)}</td>
                  <td className="k-count">{row.avg_rating == null ? '—' : Number(row.avg_rating).toFixed(2)}</td>
                  <td className="k-count">{number(row.complaints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Nothing recorded for this period.</p>
      )}
    </Panel>
  )
}

// ——— Operations & labour ———
export function MasterOperations() {
  const { data, openDrill, comparisons, shell } = useMasterPage('/api/insights/operations/')
  return shell(
    <>
      {data?.data_start ? (
        <p className="period-note muted">
          Hours come from Jobber timesheets through the Hub, starting {shortDate(data.data_start)}. Employees without a linked Jobber account are
          missing until the Hub links them.
        </p>
      ) : null}
      <Panel title="Work & efficiency" subtitle="Revenue per labour hour = revenue ÷ hours worked (shown only when hours cover the whole period).">
        <KpiGrid kpis={data?.work} comparisons={comparisons} onDrill={openDrill} />
      </Panel>
      <div className="master-grid">
        <Panel title="People" subtitle="Absences from Hub leave requests." className="span-7">
          <KpiGrid kpis={data?.people} comparisons={comparisons} onDrill={openDrill} size="sm" />
        </Panel>
        <Panel title="Payroll" subtitle="Entered per pay run in Financials." className="span-5">
          <KpiGrid kpis={data?.payroll} comparisons={comparisons} onDrill={openDrill} size="sm" columns={1} />
        </Panel>
      </div>
      <EmployeeTable title="Hours by employee" subtitle="This period, from Jobber timesheets." rows={data?.employees} />
      <TrendPanel title="Labour trend" metrics={[{ key: 'labour_hours', label: 'Labour hours' }, { key: 'visits_completed', label: 'Completed visits' }]} />
    </>,
  )
}
