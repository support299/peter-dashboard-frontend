import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { api, money, number, queryString, readJson, relative } from '../../lib'
import { formatValue, shortDate } from './format'
import { PeriodBar } from './PeriodBar'
import { useFetch, useInsights, usePeriod } from './periodState'
import './master.css'
import { confirmDialog, toast } from '../../lib/feedback'

async function call(path, method = 'POST', body) {
  return readJson(await api(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }))
}

function Section({ title, subtitle, actions, children }) {
  return (
    <article className="master-panel">
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

// ——— Alerts ———
const CONDITION_TEXT = {
  above: 'goes above',
  below: 'goes below',
  up_pct: 'rises by more than',
  down_pct: 'falls by more than',
  above_metric: 'is higher than',
  below_metric: 'is lower than',
}
const VS_METRIC = new Set(['above_metric', 'below_metric'])

function limitText(rule) {
  if (VS_METRIC.has(rule.condition)) return rule.compare_label
  const pct = rule.condition === 'up_pct' || rule.condition === 'down_pct'
  if (pct) return `${Number(rule.threshold)}% vs ${rule.compare_to === 'last_year' ? 'last year' : 'previous period'}`
  return formatValue(rule.kind, rule.threshold)
}

export function MasterAlerts() {
  const { user } = useAuth()
  const { data, error } = useInsights('/api/insights/alerts/')
  const { reload } = usePeriod()
  const [form, setForm] = useState({ metric: '', condition: 'above', threshold: '', compare_to: 'previous', compare_metric: '', note: '' })
  const [message, setMessage] = useState('')
  const canEdit = Boolean(user?.is_staff)
  const pct = form.condition === 'up_pct' || form.condition === 'down_pct'
  const versus = VS_METRIC.has(form.condition)
  const metricKind = (data?.metrics || []).find((m) => m.key === form.metric)?.kind
  const ready = form.metric && (versus ? form.compare_metric : form.threshold !== '')
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  async function run(fn) {
    setMessage('')
    try {
      await fn()
      reload()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const rules = data?.rules || []
  const hits = rules.filter((r) => r.hit)
  return (
    <div className="master">
      <PeriodBar info={data} />
      {error ? <div className="notice">{error}</div> : null}
      {message ? <div className="notice">{message}</div> : null}
      {data?.division_note ? <p className="period-note muted">{data.division_note}</p> : null}
      <Section
        title={hits.length ? `${hits.length} alert${hits.length === 1 ? '' : 's'} for ${data?.period?.label || 'this period'}` : `No alerts for ${data?.period?.label || 'this period'}`}
        subtitle="Alerts are checked for the period above. Limits on totals (revenue, counts, hours) are monthly, so they're scaled to the period: × 3 for a quarter, × 12 for a year, and to the days so far while it's running."
      >
        {rules.length ? (
          <div className="drill-table-wrap">
            <table className="drill-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Alert when it…</th>
                  <th>This period</th>
                  <th>Note</th>
                  {canEdit ? <th aria-label="Actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className={rule.hit ? 'alert-row' : ''}>
                    <td>
                      <strong>{rule.label}</strong>
                    </td>
                    <td>
                      {CONDITION_TEXT[rule.condition]} {limitText(rule)}
                    </td>
                    <td>
                      {!rule.is_active ? (
                        <span className="muted">Paused</span>
                      ) : rule.hit ? (
                        <span className="alert-text">⚠ {rule.message}</span>
                      ) : (
                        <span className="muted">{rule.hit === false ? `OK · ${rule.message}` : rule.message}</span>
                      )}
                    </td>
                    <td className="muted">{rule.note || '—'}</td>
                    {canEdit ? (
                      <td className="nowrap">
                        <button type="button" className="ghost tiny" onClick={() => run(() => call(`/api/insights/alerts/${rule.id}/`, 'PATCH', { is_active: !rule.is_active }))}>
                          {rule.is_active ? 'Pause' : 'Turn on'}
                        </button>{' '}
                        <button
                          type="button"
                          className="ghost tiny"
                          onClick={async () =>
                            (await confirmDialog({ title: 'Delete this alert?', confirmLabel: 'Delete', danger: true })) &&
                            run(() => call(`/api/insights/alerts/${rule.id}/`, 'DELETE'))
                          }
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No alerts set yet.</p>
        )}
      </Section>
      {canEdit ? (
        <Section title="Add an alert" subtitle="Examples: Cancelled visits goes above 20 · Net profit margin % goes below 10 · New clients falls by more than 25% vs last year · Lost MRR is higher than New MRR.">
          <form
            className="alert-form"
            onSubmit={(e) => {
              e.preventDefault()
              run(async () => {
                await call('/api/insights/alerts/', 'POST', form)
                setForm((prev) => ({ ...prev, threshold: '', compare_metric: '', note: '' }))
              })
            }}
          >
            <select value={form.metric} onChange={(e) => setForm((prev) => ({ ...prev, metric: e.target.value, compare_metric: '' }))} aria-label="Number">
              <option value="">Choose a number…</option>
              {(data?.metrics || []).map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <select value={form.condition} onChange={set('condition')} aria-label="Condition">
              {(data?.conditions || []).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            {versus ? (
              <select value={form.compare_metric} onChange={set('compare_metric')} aria-label="Other number">
                <option value="">Choose the other number…</option>
                {(data?.metrics || [])
                  .filter((m) => m.kind === metricKind && m.key !== form.metric)
                  .map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
              </select>
            ) : (
              <input type="number" step="0.01" placeholder={pct ? '%' : 'Limit'} value={form.threshold} onChange={set('threshold')} aria-label="Limit" />
            )}
            {pct ? (
              <select value={form.compare_to} onChange={set('compare_to')} aria-label="Compared with">
                <option value="previous">vs previous period</option>
                <option value="last_year">vs same period last year</option>
              </select>
            ) : null}
            <input placeholder="Note (optional)" value={form.note} onChange={set('note')} />
            <button type="submit" className="primary" disabled={!ready}>
              Add alert
            </button>
          </form>
          <p className="muted tiny-text">Enter limits on totals as a monthly amount. They're scaled automatically for quarters, years and periods still running. Percentages and averages stay as entered.</p>
        </Section>
      ) : (
        <p className="muted">Only managers can add or change alerts.</p>
      )}
    </div>
  )
}

// ——— Revenue rules ———
function RuleRow({ rule, divisions, categories, onDone }) {
  const [keyword, setKeyword] = useState(rule.keyword)
  const [priority, setPriority] = useState(rule.priority)
  const save = (body) => call(`/api/insights/rules/${rule.id}/`, 'PATCH', body).then(onDone).catch((err) => toast(err.message, { type: 'error' }))
  return (
    <tr className={rule.active ? '' : 'muted-row'}>
      <td>
        <input className="cell-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} onBlur={() => keyword !== rule.keyword && save({ keyword })} />
      </td>
      <td>
        <select value={rule.division} onChange={(e) => save({ division: e.target.value })}>
          <option value="">Same as the main service</option>
          {divisions.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select value={rule.revenue_category} onChange={(e) => save({ revenue_category: e.target.value })}>
          <option value="">Depends on the job</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="cell-input narrow"
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          onBlur={() => Number(priority) !== rule.priority && save({ priority })}
        />
      </td>
      <td>
        <input type="checkbox" checked={rule.active} onChange={(e) => save({ active: e.target.checked })} aria-label="Active" />
      </td>
      <td>
        <button
          type="button"
          className="ghost tiny"
          onClick={async () =>
            (await confirmDialog({ title: `Delete the rule “${rule.keyword}”?`, confirmLabel: 'Delete', danger: true })) &&
            call(`/api/insights/rules/${rule.id}/`, 'DELETE').then(onDone).catch((err) => toast(err.message, { type: 'error' }))
          }
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

export function MasterRules() {
  const [version, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)
  const { data, error } = useFetch('/api/insights/rules/', version)
  const [draft, setDraft] = useState({ keyword: '', division: '', revenue_category: '', priority: 50 })
  const [test, setTest] = useState({ name: '', company: false })
  const [testResult, setTestResult] = useState(null)
  const [lineQuery, setLineQuery] = useState({ q: '', unmatched: '1' })
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const lines = useFetch(`/api/insights/rules/lines/${queryString({ q: search, unmatched: lineQuery.unmatched })}`, version)
  const status = data?.status || {}
  const busy = ['queued', 'running'].includes(status.state)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(lineQuery.q.trim()), 300)
    return () => clearTimeout(timer)
  }, [lineQuery.q])

  useEffect(() => {
    if (!busy) return undefined
    const timer = setInterval(() => setVersion((v) => v + 1), 5000)
    return () => clearInterval(timer)
  }, [busy])

  async function act(fn) {
    setMessage('')
    try {
      await fn()
      refresh()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const divisions = data?.divisions || []
  const categories = data?.categories || []
  return (
    <div className="master">
      {error ? <div className="notice">{error}</div> : null}
      {message ? <div className="notice">{message}</div> : null}
      <div className={`rules-status${status.pending_changes ? ' pending' : ''}`}>
        {busy ? (
          <span>Recalculating revenue, divisions and MRR with the new rules… this takes a minute or two.</span>
        ) : status.pending_changes ? (
          <>
            <span>Rules changed. Revenue still uses the old rules until you recalculate (or until tonight's sync).</span>
            <button type="button" className="primary" onClick={() => act(() => call('/api/insights/rules/apply/'))}>
              Recalculate now
            </button>
          </>
        ) : (
          <span>
            All rules are applied{status.finished_at ? ` (last recalculated ${relative(status.finished_at)})` : ''}.
            {status.state === 'failed' && status.error ? ` Last attempt failed: ${status.error}` : ''}
          </span>
        )}
      </div>

      <Section title="Test a line item" subtitle="Type a line item name as it appears on a Jobber invoice to see how it's sorted.">
        <form
          className="alert-form"
          onSubmit={(e) => {
            e.preventDefault()
            act(async () => setTestResult(await call('/api/insights/rules/test/', 'POST', test)))
          }}
        >
          <input placeholder="e.g. Window Cleaning (Interior)" value={test.name} onChange={(e) => setTest((p) => ({ ...p, name: e.target.value }))} />
          <label className="inline-check">
            <input type="checkbox" checked={test.company} onChange={(e) => setTest((p) => ({ ...p, company: e.target.checked }))} /> Company client
          </label>
          <button type="submit" className="primary" disabled={!test.name.trim()}>
            Test
          </button>
        </form>
        {testResult ? (
          <p className="rules-test">
            {testResult.rule ? (
              <>
                Matches rule <b>“{testResult.rule.keyword}”</b>.{' '}
              </>
            ) : (
              <>No rule matches, so it's sorted like the invoice's main service (or Residential if it has none). </>
            )}
            On a recurring job: <b>{testResult.results.recurring.division}</b> · {testResult.results.recurring.category}. One-off:{' '}
            <b>{testResult.results.one_off.division}</b> · {testResult.results.one_off.category}.
          </p>
        ) : null}
      </Section>

      <Section
        title="Rules"
        subtitle="A rule matches when its word or phrase appears in the line item name (whole words, accents ignored). Lower priority numbers are checked first. “Same as the main service” is for add-ons like “Inside oven”."
      >
        <form
          className="alert-form"
          onSubmit={(e) => {
            e.preventDefault()
            act(async () => {
              await call('/api/insights/rules/', 'POST', draft)
              setDraft((p) => ({ ...p, keyword: '' }))
            })
          }}
        >
          <input placeholder="Word or phrase" value={draft.keyword} onChange={(e) => setDraft((p) => ({ ...p, keyword: e.target.value }))} />
          <select value={draft.division} onChange={(e) => setDraft((p) => ({ ...p, division: e.target.value }))}>
            <option value="">Same as the main service</option>
            {divisions.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <select value={draft.revenue_category} onChange={(e) => setDraft((p) => ({ ...p, revenue_category: e.target.value }))}>
            <option value="">Depends on the job</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <input type="number" className="narrow" value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))} aria-label="Priority" />
          <button type="submit" className="primary" disabled={draft.keyword.trim().length < 2}>
            Add rule
          </button>
        </form>
        <div className="drill-table-wrap">
          <table className="drill-table rules-table">
            <thead>
              <tr>
                <th>Word or phrase</th>
                <th>Division</th>
                <th>Revenue type</th>
                <th>Priority</th>
                <th>On</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(data?.rules || []).map((rule) => (
                <RuleRow key={`${rule.id}-${rule.updated_at}`} rule={rule} divisions={divisions} categories={categories} onDone={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Line items billed (last 24 months)"
        subtitle="Items without a rule are listed first. Click “Make a rule” to start a rule from one."
        actions={
          <div className="trend-controls">
            <input placeholder="Search line items" value={lineQuery.q} onChange={(e) => setLineQuery((p) => ({ ...p, q: e.target.value }))} />
            <select value={lineQuery.unmatched} onChange={(e) => setLineQuery((p) => ({ ...p, unmatched: e.target.value }))}>
              <option value="1">Without a rule</option>
              <option value="">All</option>
            </select>
          </div>
        }
      >
        <div className="drill-table-wrap">
          <table className="drill-table">
            <thead>
              <tr>
                <th>Line item</th>
                <th className="k-count">Times</th>
                <th className="k-currency">Revenue</th>
                <th>Sorted as</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(lines.data?.lines || []).map((line) => (
                <tr key={line.name}>
                  <td>
                    {line.name}
                    {line.matched ? null : <span className="price-source p-none"> no rule</span>}
                  </td>
                  <td className="k-count">{number(line.count)}</td>
                  <td className="k-currency">{money(line.revenue)}</td>
                  <td>
                    {line.division} · <span className="muted">{line.category}</span>
                  </td>
                  <td>
                    <button type="button" className="ghost tiny" onClick={() => setDraft((p) => ({ ...p, keyword: line.name }))}>
                      Make a rule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lines.data && !lines.data.lines.length ? <p className="muted empty">Nothing to show.</p> : null}
        </div>
      </Section>
    </div>
  )
}

// ——— Old MRR tab (shown on the MRR page) ———
function PlanSearch({ onPick }) {
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setTerm(q.trim()), 300)
    return () => clearTimeout(timer)
  }, [q])
  const { data } = useFetch(`/api/insights/mrr/plan-search/${queryString({ q: term })}`)
  return (
    <span className="plan-search">
      <input placeholder="Find a Jobber plan…" value={q} onChange={(e) => setQ(e.target.value)} />
      {term.length >= 2 && data?.plans?.length ? (
        <span className="plan-search-results">
          {data.plans.map((plan) => (
            <button key={plan.id} type="button" onClick={() => onPick(plan)}>
              {plan.name} · {money(plan.monthly_value)} · {plan.status}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  )
}

export function OldTabPanel({ version, onChanged }) {
  const { user } = useAuth()
  const [local, setLocal] = useState(0)
  const { data } = useFetch('/api/insights/mrr/old-tab/', version + local)
  const [message, setMessage] = useState('')
  const s = data?.summary

  async function link(booking, body) {
    setMessage('')
    try {
      await call(`/api/insights/mrr/old-tab/${booking.id}/`, 'PATCH', body)
      setLocal((v) => v + 1)
      onChanged?.()
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (!s || !s.bookings) return null
  return (
    <Section
      title="Old MRR tab"
      subtitle="The old tab's bookings are linked to their Jobber plans, so their details (sales person, why it ended) show in Edit. Jobber stays the source of MRR: nothing from the old tab is added on top."
    >
      {message ? <div className="notice">{message}</div> : null}
      <p className="old-tab-summary">
        {number(s.bookings)} bookings: <b>{number(s.linked)}</b> linked to a Jobber plan, <b>{number(s.needs_review)}</b> to review, {number(s.ignored)} marked
        “not in Jobber”. Old tab active MRR {money(s.old_active_mrr)}; of that, {money(s.old_active_linked_mrr)} is linked (Jobber says{' '}
        {money(s.jobber_mrr_of_linked)} for the same plans) and {money(s.old_active_unlinked_mrr)} isn't matched yet.
        {s.shared_plans ? ` ${number(s.shared_plans)} Jobber plan${s.shared_plans === 1 ? ' has' : 's have'} more than one old booking (compared together below).` : ''}
      </p>
      {data.needs_review.length ? (
        <>
          <h4 className="fin-subhead">To review: no Jobber plan found by name</h4>
          <div className="drill-table-wrap">
            <table className="drill-table">
              <thead>
                <tr>
                  <th>Booking (old tab)</th>
                  <th>Status</th>
                  <th className="k-currency">Monthly</th>
                  <th>Start</th>
                  <th>Link to</th>
                </tr>
              </thead>
              <tbody>
                {data.needs_review.map((b) => (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.status}</td>
                    <td className="k-currency">{money(b.monthly_value)}</td>
                    <td>{shortDate(b.start_date)}</td>
                    <td className="link-cell">
                      {user?.is_staff ? (
                        <>
                          {b.suggestions.map((plan) => (
                            <button key={plan.id} type="button" className="ghost tiny" onClick={() => link(b, { plan_id: plan.id })}>
                              {plan.name} ({money(plan.monthly_value)})
                            </button>
                          ))}
                          <PlanSearch onPick={(plan) => link(b, { plan_id: plan.id })} />
                          <button type="button" className="ghost tiny" onClick={() => link(b, { ignore: true })}>
                            Not in Jobber
                          </button>
                        </>
                      ) : (
                        <span className="muted">A manager can link it.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      {data.differences.length ? (
        <>
          <h4 className="fin-subhead">Linked, but the monthly value differs by 10% or more</h4>
          <div className="drill-table-wrap">
            <table className="drill-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="k-currency">Old tab</th>
                  <th className="k-currency">Jobber now</th>
                  <th className="k-currency">Difference</th>
                </tr>
              </thead>
              <tbody>
                {data.differences.map((d) => (
                  <tr key={d.booking_id}>
                    <td>{d.booking}</td>
                    <td className="k-currency">{money(d.old_tab)}</td>
                    <td className="k-currency">{money(d.jobber)}</td>
                    <td className="k-currency">{money(Number(d.jobber) - Number(d.old_tab))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted tiny-text">Usually a price change or a plan that ended in Jobber. If Jobber is wrong, correct it with Edit in the plans list above.</p>
        </>
      ) : null}
    </Section>
  )
}
