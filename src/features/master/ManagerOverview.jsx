import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { NavIcon } from '../../components/layout/NavIcon'
import { money, number, queryString } from '../../lib'
import { formatValue, shortDate, splitLabel, tone } from './format'
import { HowInfo } from './KpiCard'
import { HistoryChart } from './ManagerCharts'
import { Panel } from './MasterPages'
import { useFetch, usePeriod } from './periodState'
import { useMasterPage } from './useMasterPage'
import { SkeletonCharts } from '../../components/Skeleton'

/*
 * Manager Overview for Cassidy, laid out like Peter's mockup (Nov 2026): six big numbers, a Needs
 * Attention strip, revenue vs. target, staffing cards with the time-off requests, four compact lists
 * and six small charts. Every number is one of the Master Dashboard KPIs, so it matches the other
 * pages and opens the same record lists. The 4-week capacity forecast arrives once checked with Peter.
 */

// Chart colours from the mockup: blue bars, green targets and good news, orange and red for problems.
const C = { blue: '#2563eb', softBlue: '#bfdbfe', green: '#16a34a', orange: '#f59e0b', red: '#dc2626' }
const byKey = (cards = []) => Object.fromEntries(cards.map((card) => [card.key, card]))
const signed = (value) => `${Number(value) > 0 ? '+' : ''}${money(value)}`
const minus = (value) => (Number(value) > 0 ? `−${money(value)}` : money(value))
const plural = (count, word, words = `${word}s`) => (Number(count) === 1 ? word : words)

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2.5 20h19L12 3z" />
      <path d="M12 9v5M12 17.5v.5" />
    </svg>
  )
}

/** "▲ 12.5% vs prev. period", coloured by whether that's good news for this number. */
function Delta({ kpi }) {
  if (kpi.previous === undefined) return null
  if (kpi.previous === null) return <span className="mgr-delta flat">vs prev. period: n/a</span>
  const diff = Number(kpi.current) - Number(kpi.previous)
  const base = Number(kpi.previous)
  const text = !diff ? 'no change' : !base ? `${diff > 0 ? '▲' : '▼'} new` : `${diff > 0 ? '▲' : '▼'} ${Math.abs((diff / Math.abs(base)) * 100).toFixed(1)}%`
  return (
    <span className={`mgr-delta ${tone(diff, kpi.better)}`} title={`Previous period: ${formatValue(kpi.kind, kpi.previous)}`}>
      {text} vs prev. period
    </span>
  )
}

function HeadlineCard({ kpi, label, value, drill, drillTitle, onDrill }) {
  if (!kpi) return null
  const clickable = Boolean(kpi.available && (drill || kpi.drill) && onDrill)
  const Tag = clickable ? 'button' : 'div'
  return (
    <Tag
      type={clickable ? 'button' : undefined}
      className={`mgr-card${clickable ? ' clickable' : ''}${kpi.available ? '' : ' unavailable'}`}
      onClick={clickable ? () => onDrill(drill || kpi.drill, drillTitle || kpi.label) : undefined}
      title={clickable ? 'Click to see the records behind this number' : undefined}
    >
      <span className="mgr-card-label">
        {label || kpi.label}
        <HowInfo text={kpi.how} />
      </span>
      <strong className="mgr-card-value">{kpi.available ? (value ?? formatValue(kpi.kind, kpi.current)) : '—'}</strong>
      {kpi.available ? <Delta kpi={kpi} /> : <span className="mgr-delta flat">{kpi.note || 'No data for this period.'}</span>}
      {clickable ? (
        <span className="mgr-chev" aria-hidden="true">
          ›
        </span>
      ) : null}
    </Tag>
  )
}

function Headline({ cards, onDrill }) {
  const k = byKey(cards)
  const completed = k.visits_completed
  const planned = k.visits_planned
  return (
    <div className="mgr-headline">
      <HeadlineCard kpi={k.leads} label="New leads" onDrill={onDrill} />
      <HeadlineCard kpi={k.bookings_won} onDrill={onDrill} />
      <HeadlineCard kpi={k.new_recurring_clients} onDrill={onDrill} />
      <HeadlineCard kpi={k.mrr_net_new} label="Net MRR change" value={k.mrr_net_new?.available ? signed(k.mrr_net_new.current) : undefined} onDrill={onDrill} />
      <HeadlineCard
        kpi={completed}
        label="Visits completed / planned"
        value={completed?.available ? `${number(completed.current)} / ${planned?.available ? number(planned.current) : '—'}` : undefined}
        onDrill={onDrill}
      />
      <HeadlineCard kpi={k.invoiced_revenue} onDrill={onDrill} />
    </div>
  )
}

const hrs = (value) => `${Number(value || 0).toFixed(1).replace(/\.0$/, '')} h`
const dayLabel = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}
const shortDay = (iso) => dayLabel(iso).replace(/^[^,]+, /, '')
const scrollToCapacity = () => document.getElementById('capacity')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

function AttentionStrip({ attention, staff, capacity, onDrill: openDrill }) {
  const gaps = capacity?.gap_days || 0
  const rebook = attention?.visits_to_rebook || 0
  const confirm = attention?.first_visits_to_confirm || 0
  const overdue = attention?.overdue_complaints || 0
  const pending = staff?.pending_time_off?.length || 0
  return (
    <div className="mgr-attention" role="region" aria-label="Needs attention">
      <span className="mgr-attention-title">
        <WarnIcon /> Needs attention
      </span>
      <button type="button" className="mgr-attention-item" disabled={!rebook} onClick={() => openDrill('visits_to_rebook', 'Visits to rebook')} title="Past visits that were never completed">
        <b className={rebook ? 'bad' : ''}>{number(rebook)}</b> {plural(rebook, 'visit')} to rebook <span aria-hidden="true">›</span>
      </button>
      <button type="button" className="mgr-attention-item" disabled={!confirm} onClick={() => openDrill('first_visits_to_confirm', 'First visits to confirm')} title="Approved bookings with no visit scheduled in Jobber yet">
        <b className={confirm ? 'bad' : ''}>{number(confirm)}</b> first {plural(confirm, 'visit')} to confirm <span aria-hidden="true">›</span>
      </button>
      <button type="button" className="mgr-attention-item" disabled={!overdue} onClick={() => openDrill('complaints_overdue', 'Overdue complaints')} title="Open for more than 1 business day">
        <b className={overdue ? 'bad' : ''}>{number(overdue)}</b> overdue {plural(overdue, 'complaint')} <span aria-hidden="true">›</span>
      </button>
      <a className="mgr-attention-item" href={staff?.hub_time_off_url} target="_blank" rel="noreferrer">
        <b className={pending ? 'bad' : ''}>{number(pending)}</b> time-off {plural(pending, 'request')} to review <span aria-hidden="true">↗</span>
      </a>
      {capacity && !capacity.division_view ? (
        <button type="button" className="mgr-attention-item" disabled={!gaps} onClick={scrollToCapacity} title="Days in the next 4 weeks with more hours booked than available">
          <b className={gaps ? 'bad' : ''}>{number(gaps)}</b> coverage {plural(gaps, 'gap')} <span aria-hidden="true">›</span>
        </button>
      ) : null}
      <span className="mgr-attention-note muted">As of today</span>
    </div>
  )
}

function RevenueTarget({ target, onDrill }) {
  if (!target) return null
  if (target.target == null) {
    return (
      <Panel title={`Revenue vs. target · ${target.month}`}>
        <p className="muted">No target: there's no invoiced revenue for the same month last year.</p>
      </Panel>
    )
  }
  const pct = Math.round((target.progress || 0) * 100)
  return (
    <Panel title={`Revenue vs. target · ${target.month}`} subtitle={`Target = same month last year (${money(target.last_year)}) + 20%. Always the current month.`}>
      <div className="fin-stats manager-target">
        <div>
          <span>Target</span>
          <strong>{money(target.target)}</strong>
        </div>
        <div>
          <span>Invoiced so far</span>
          <strong>{money(target.invoiced)}</strong>
        </div>
        <div>
          <span>Expected from bookings</span>
          <button type="button" className="link-button" onClick={() => onDrill('revenue_expected', 'Bookings still to invoice this month')}>
            <strong>{money(target.expected)}</strong>
          </button>
          <small className="muted">
            {number(target.visits_counted)} {plural(target.visits_counted, 'visit')} not invoiced yet
          </small>
        </div>
        <div>
          <span>Forecasted revenue</span>
          <strong>{money(target.forecast)}</strong>
        </div>
        <div className={target.on_track ? 'good' : 'bad'}>
          <span>{target.on_track ? 'Status' : 'Still to book'}</span>
          <strong>{target.on_track ? 'On track to hit target' : money(target.still_to_book)}</strong>
        </div>
      </div>
      <div className={`manager-progress ${target.on_track ? 'good' : 'bad'}`} role="img" aria-label={`Forecast is ${pct}% of target`}>
        <i style={{ width: `${pct}%` }} />
      </div>
      {target.unpriced_visits ? (
        <p className="muted tiny-text">
          {number(target.unpriced_visits)} upcoming {plural(target.unpriced_visits, 'visit has', 'visits have')} no price in Jobber and add nothing to the forecast.
        </p>
      ) : null}
    </Panel>
  )
}

function DayTile({ iso, day, onOpen }) {
  const weekday = dayLabel(iso).split(',')[0]
  if (!day) {
    return (
      <div className="cap-day past">
        <span className="cap-day-name">
          {weekday} <small>{shortDay(iso)}</small>
        </span>
        <strong>Past</strong>
      </div>
    )
  }
  const noWork = day.available == null && !Number(day.booked)
  const short = Number(day.shortfall)
  const state = noWork ? 'off' : day.available == null ? 'unconfirmed' : short ? 'short' : 'open'
  const headline = noWork
    ? '—'
    : day.available == null
      ? 'Unconfirmed'
      : day.bookable == null
        ? `${hrs(day.booked)} booked`
        : short
          ? `${hrs(short)} short`
          : hrs(day.bookable)
  return (
    <button type="button" className={`cap-day ${state}`} onClick={() => onOpen(day)} title="See the cleaners and visits behind this number">
      <span className="cap-day-name">
        {weekday} <small>{shortDay(iso)}</small>
      </span>
      <strong>{headline}</strong>
      {noWork ? (
        <small className="muted">Nothing scheduled</small>
      ) : (
        <>
          <small className="muted">
            {day.available != null ? `${Number(day.booked)} / ${hrs(day.available)}` : hrs(day.booked)} booked
          </small>
          {day.cleaners?.length ? (
            <small className="muted">
              {day.cleaners.length} cleaners{day.per_cleaner != null ? ` · ${day.per_cleaner} h each` : ''}
            </small>
          ) : null}
        </>
      )}
      {day.on_leave?.length ? <small className="cap-leave">Off (approved): {day.on_leave.join(', ')}</small> : null}
      {day.if_approved ? (
        <small className="cap-if">
          If {day.pending_leave.join(', ')}'s time off is approved:{' '}
          {Number(day.if_approved.shortfall) ? `${hrs(day.if_approved.shortfall)} short` : `${hrs(day.if_approved.bookable)} bookable`}
        </small>
      ) : null}
      {day.review?.length ? <small className="cap-check">{day.review.length} with unclear hours</small> : null}
    </button>
  )
}

function Capacity({ capacity, onDrill }) {
  const [weekIndex, setWeekIndex] = useState(0)
  if (!capacity) return null
  const index = Math.min(weekIndex, capacity.weeks.length - 1)
  const week = capacity.weeks[index]
  const byDate = Object.fromEntries(week.days.map((d) => [d.date, d]))
  const [y, m, d] = String(week.start).split('-').map(Number)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(y, m - 1, d + i)
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  })
  const labels = capacity.weeks.map((w) => shortDay(w.start))
  const t = week.totals
  const weekPicker = (
    <div className="seg">
      {capacity.weeks.map((w, i) => (
        <button key={w.start} type="button" className={i === index ? 'active' : ''} onClick={() => setWeekIndex(i)}>
          {labels[i]}
        </button>
      ))}
    </div>
  )
  return (
    <section id="capacity" className="master-panel cap-panel">
      <header className="master-panel-head">
        <div>
          <h3>Capacity · next 4 weeks</h3>
          <p className="muted">
            Booked = cleaner-hours written in each visit's instructions. Available = cleaners on the day's “Available Cleaners” task × {Number(capacity.hours_per_cleaner)} h.
            Bookable = available − booked; more booked than available shows as a red shortfall. Always the next 4 weeks; this week counts from today.
          </p>
        </div>
      </header>
      {capacity.review_staffing ? (
        <div className="cap-banner">
          <WarnIcon /> <b>Review staffing:</b> shortages in 3 weeks in a row. Worth raising with Peter.
        </div>
      ) : null}
      {capacity.division_view ? (
        <p className="notice">Available hours are for the whole company, so bookable hours and shortfalls only show with “All divisions”. Booked hours here are for the chosen division.</p>
      ) : null}
      <div className="cap-grid">
        <div className="mgr-chart">
          <h4>Booked vs. available hours</h4>
          <HistoryChart
            title="Booked vs. available hours, next 4 weeks"
            labels={labels}
            titles={capacity.weeks.map((w) => `Week of ${shortDay(w.start)}`)}
            kind="count"
            series={[
              { key: 'booked', label: 'Booked', type: 'bar', color: '#1e3a8a', points: capacity.weeks.map((w) => w.totals.booked) },
              { key: 'available', label: 'Available', type: 'bar', color: C.green, points: capacity.weeks.map((w) => w.totals.available) },
            ]}
          />
          <div className="cap-week-sums">
            {capacity.weeks.map((w, i) => (
              <button key={w.start} type="button" className={i === index ? 'active' : ''} onClick={() => setWeekIndex(i)}>
                <span>{labels[i]}</span>
                <b className={Number(w.totals.shortfall) ? 'bad-text' : 'good-text'}>
                  {w.totals.bookable == null ? '—' : Number(w.totals.shortfall) ? `${hrs(w.totals.shortfall)} short` : `${hrs(w.totals.bookable)} open`}
                </b>
              </button>
            ))}
          </div>
        </div>
        <div className="cap-days-wrap">
          <div className="cap-days-head">
            <h4>Bookable hours by day</h4>
            {weekPicker}
          </div>
          <div className="cap-days">
            {dates.map((iso) => (
              <DayTile key={iso} iso={iso} day={byDate[iso]} onOpen={(day) => onDrill('capacity_day', dayLabel(day.date), { category: day.date })} />
            ))}
          </div>
          <p className="cap-total">
            Week of {labels[index]}: <b className="good-text">{t.bookable == null ? '—' : hrs(t.bookable)} bookable</b>
            {Number(t.shortfall) ? (
              <>
                {' · '}
                <b className="bad-text">{hrs(t.shortfall)} short</b>
              </>
            ) : null}
            <small className="muted">Openings and shortages are added up separately: one day's openings don't cover another day's shortage.</small>
          </p>
          <p className="muted tiny-text">
            Click a day to see its cleaners and visits. Approved time off takes that person off the day; pending requests show as “if approved”.
            {capacity.to_review ? (
              <>
                {' '}
                <button type="button" className="link-button" onClick={() => onDrill('capacity_review', 'Visits to check: hours')}>
                  {number(capacity.to_review)} {plural(capacity.to_review, 'visit has', 'visits have')} unclear hours ›
                </button>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  )
}

function TimeOffList({ rows, empty }) {
  if (!rows.length) return <p className="muted tiny-text">{empty}</p>
  return (
    <ul className="manager-leave">
      {rows.map((row) => (
        <li key={row.id}>
          <div>
            <strong>{row.employee}</strong> · {row.type || 'Time off'} · {shortDate(row.start)}
            {row.end && row.end !== row.start ? ` – ${shortDate(row.end)}` : ''}
            <small className="muted"> · {row.affected_visits.length ? `${row.affected_visits.length} ${plural(row.affected_visits.length, 'visit')} affected` : 'no visits affected'}</small>
            {row.affected_visits.length ? (
              <ul className="manager-affected">
                {row.affected_visits.slice(0, 6).map((visit) => (
                  <li key={visit.jobber_visit_id || `${visit.date}${visit.client_name}`}>
                    {shortDate(visit.date)} · {visit.client_name || visit.job_title}
                    {visit.headcount ? <small className="muted"> · {visit.headcount} on the visit</small> : null}
                  </li>
                ))}
                {row.affected_visits.length > 6 ? <li className="muted">and {row.affected_visits.length - 6} more</li> : null}
              </ul>
            ) : null}
          </div>
          {row.status === 'pending' ? (
            <a className="ghost tiny" href={row.review_url} target="_blank" rel="noreferrer">
              Review ↗
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function CapacityWeeks({ capacity }) {
  if (!capacity) return null
  return (
    <div className="drill-table-wrap">
      <table className="drill-table cap-table">
        <thead>
          <tr>
            <th>Week of</th>
            <th>Booked</th>
            <th>Available</th>
            <th>Bookable</th>
            <th>Short</th>
          </tr>
        </thead>
        <tbody>
          {capacity.weeks.map((week) => {
            const t = week.totals
            const ifShort = t.if_approved && Number(t.if_approved.shortfall) > Number(t.shortfall || 0)
            return (
              <tr key={week.start}>
                <td>{shortDay(week.start)}</td>
                <td>{hrs(t.booked)}</td>
                <td>{t.available == null ? <span className="muted">Unconfirmed</span> : hrs(t.available)}</td>
                <td className="good-text">{t.bookable == null ? '—' : hrs(t.bookable)}</td>
                <td className={Number(t.shortfall) ? 'bad-text' : 'muted'}>
                  {Number(t.shortfall) ? hrs(t.shortfall) : '—'}
                  {ifShort ? <small className="cap-if">{hrs(t.if_approved.shortfall)} if time off is approved</small> : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Staffing({ staff, capacity }) {
  const gap = capacity?.next_gap
  const pending = staff?.pending_time_off || []
  // The roster lives in the Internal App: only linked for people who may open it.
  const { user } = useAuth()
  const limited = Array.isArray(user?.pages) && !user.pages.includes('internal')
  const Workforce = limited ? 'div' : Link
  return (
    <Panel
      title="Staffing & capacity"
      subtitle={staff ? `Active staff today. Time off from ${shortDate(staff.window.from)} to ${shortDate(staff.window.to)}.` : null}
      actions={
        limited ? null : (
          <Link className="ghost tiny" to="/internal/employees">
            Roster →
          </Link>
        )
      }
    >
      <div className="mgr-stats">
        <Workforce className="mgr-stat" {...(limited ? {} : { to: '/internal/employees' })}>
          <span className="mgr-stat-icon">
            <NavIcon name="employees" />
          </span>
          <span>
            <span className="mgr-stat-label">Active workforce</span>
            <strong>
              {number(staff?.employees)} {plural(staff?.employees, 'employee')} · {number(staff?.contractors)} {plural(staff?.contractors, 'contractor')}
            </strong>
          </span>
          {limited ? null : (
            <span className="mgr-chev" aria-hidden="true">
              ›
            </span>
          )}
        </Workforce>
        <a className="mgr-stat" href={staff?.hub_time_off_url} target="_blank" rel="noreferrer">
          <span className="mgr-stat-icon">
            <NavIcon name="leave" />
          </span>
          <span>
            <span className="mgr-stat-label">Pending time-off</span>
            <strong>
              {number(pending.length)} {plural(pending.length, 'request')}
            </strong>
          </span>
          <span className="mgr-chev" aria-hidden="true">
            ↗
          </span>
        </a>
        <button type="button" className={`mgr-stat${gap ? ' gap' : ''}`} onClick={scrollToCapacity} disabled={!capacity}>
          <span className={`mgr-stat-icon${gap ? ' warn' : ''}`}>
            <WarnIcon />
          </span>
          <span>
            <span className="mgr-stat-label">Next coverage gap</span>
            {capacity?.division_view ? (
              <strong className="muted">Shown with All divisions</strong>
            ) : gap ? (
              <strong className="bad-text">
                {hrs(gap.hours)} short · {dayLabel(gap.date)}
              </strong>
            ) : (
              <strong className="good-text">None in the next 4 weeks</strong>
            )}
          </span>
          <span className="mgr-chev" aria-hidden="true">
            ›
          </span>
        </button>
      </div>
      <div className="mgr-staff-grid">
        <div>
          <h4>Time-off requests</h4>
          <TimeOffList rows={pending} empty="No requests waiting." />
          <h4>Approved time off (next 4 weeks)</h4>
          <TimeOffList rows={staff?.approved_time_off || []} empty="None in the next 4 weeks." />
          {staff?.contractor_unavailable?.length ? (
            <>
              <h4>Contractors unavailable</h4>
              <TimeOffList rows={staff.contractor_unavailable} empty="" />
            </>
          ) : null}
        </div>
        <div>
          <h4>Four-week capacity</h4>
          <CapacityWeeks capacity={capacity} />
        </div>
      </div>
    </Panel>
  )
}

/** A compact list like the mockup's Sales / Recurring Revenue / Scheduling / Client Experience boxes. */
function MiniList({ title, rows, onDrill }) {
  return (
    <div className="mgr-list">
      <h4>{title}</h4>
      {rows.map((row) => {
        const kpi = row.kpi
        if (!kpi) return null
        const clickable = Boolean(kpi.available && kpi.drill && onDrill)
        const Tag = clickable ? 'button' : 'div'
        return (
          <Tag
            key={row.key}
            type={clickable ? 'button' : undefined}
            className={`mgr-row${clickable ? ' clickable' : ''}${kpi.available ? '' : ' muted'}`}
            onClick={clickable ? () => onDrill(kpi.drill, kpi.label) : undefined}
            title={kpi.available ? kpi.how || undefined : kpi.note || 'No data for this period.'}
          >
            {row.render(kpi)}
            {clickable ? (
              <span className="mgr-chev" aria-hidden="true">
                ›
              </span>
            ) : null}
          </Tag>
        )
      })}
    </div>
  )
}

const value = (kpi, fmt) => (kpi.available ? (fmt ? fmt(kpi.current) : formatValue(kpi.kind, kpi.current)) : '—')
const badIfAny = (kpi) => (kpi.available && Number(kpi.current) > 0 ? 'bad' : '')
const goodIfAny = (kpi) => (kpi.available && Number(kpi.current) > 0 ? 'good' : '')
// Label on the left, value on the right.
const labelled = (label, fmt, cls = () => '') => ({ key: label, render: (kpi) => (<><span>{label}</span><b className={cls(kpi)}>{value(kpi, fmt)}</b></>) })
// "5 cancelled visits": the number first, like the mockup's Scheduling box.
const counted = (word, words, cls = badIfAny) => ({ key: word, render: (kpi) => (<span><b className={cls(kpi)}>{value(kpi)}</b> {kpi.available ? plural(kpi.current, word, words) : words}</span>) })

function Lists({ data, onDrill }) {
  const sales = byKey(data.sales)
  const recurring = byKey(data.recurring)
  const scheduling = byKey(data.scheduling)
  const cx = byKey(data.client_experience)
  const withKpi = (rows, cards) => rows.map(([key, row]) => ({ ...row, key: `${key}-${row.key}`, kpi: cards[key] }))
  const feedback = cx.feedback_score && {
    key: 'feedback',
    kpi: cx.feedback_score,
    render: (kpi) => (
      <span>
        <b className={kpi.available ? 'good' : ''}>{kpi.available ? `${Number(kpi.current).toFixed(1)}/5` : '—'}</b>
        {cx.feedback_responses?.available ? ` from ${number(cx.feedback_responses.current)} ${plural(cx.feedback_responses.current, 'client')}` : ' client feedback'}
      </span>
    ),
  }
  return (
    <div className="mgr-lists">
      <MiniList title="Sales" onDrill={onDrill} rows={withKpi([['avg_booking_price', labelled('Avg. booking')], ['open_leads', labelled('Open leads')]], sales)} />
      <MiniList
        title="Recurring revenue"
        onDrill={onDrill}
        rows={withKpi(
          [
            ['mrr_new', labelled('New', signed, goodIfAny)],
            ['mrr_expansion', labelled('Expansion', signed, goodIfAny)],
            ['mrr_contraction', labelled('Reductions', minus, badIfAny)],
            ['mrr_churned', labelled('Lost', minus, badIfAny)],
            ['cancelled_recurring_clients', counted('client lost', 'clients lost')],
          ],
          recurring,
        )}
      />
      <MiniList
        title="Scheduling"
        onDrill={onDrill}
        rows={withKpi(
          [
            ['cancelled_visits', counted('cancelled visit', 'cancelled visits')],
            ['cancelled_recurring_jobs', counted('cancelled job', 'cancelled jobs')],
            ['late_arrivals', counted('late arrival', 'late arrivals')],
            ['absence_days', counted('absence day', 'absence days')],
          ],
          scheduling,
        )}
      />
      <MiniList
        title="Client experience"
        onDrill={onDrill}
        rows={[
          ...withKpi(
            [
              ['complaints', counted('complaint', 'complaints')],
              ['touch_ups', counted('touch-up', 'touch-ups')],
              ['google_five_star_new', counted('five-star review', 'five-star reviews', goodIfAny)],
            ],
            cx,
          ),
          feedback,
        ].filter(Boolean)}
      />
    </div>
  )
}

const CHARTS = [
  {
    title: 'Revenue vs. target',
    weekTitle: 'Revenue',
    kind: 'currency',
    series: [
      { key: 'invoiced_revenue', label: 'Revenue', type: 'bar', color: C.blue },
      { key: 'revenue_target', label: 'Target', type: 'line', dashed: true, color: C.green, monthOnly: true },
    ],
  },
  {
    title: 'Quality over time',
    subtitle: 'per 100 completed visits',
    kind: 'rate',
    series: [
      { key: 'touch_up_rate', label: 'Touch-ups', type: 'line', color: C.orange },
      { key: 'complaint_rate', label: 'Complaints', type: 'line', color: C.red },
    ],
  },
  {
    title: 'Leads & bookings',
    kind: 'count',
    series: [
      { key: 'leads', label: 'Leads', type: 'bar', color: C.green },
      { key: 'bookings_won', label: 'Bookings won', type: 'bar', color: C.blue },
    ],
  },
  {
    title: 'Recurring revenue',
    subtitle: 'ending MRR',
    kind: 'currency',
    series: [{ key: 'mrr', label: 'Ending MRR', type: 'area', color: C.green }],
    // MRR is worked out by month: by week the chart shows recurring clients gained and lost instead.
    week: {
      title: 'Recurring clients',
      kind: 'count',
      series: [
        { key: 'new_recurring_clients', label: 'Gained', type: 'bar', color: C.green },
        { key: 'cancelled_recurring_clients', label: 'Lost', type: 'bar', color: C.red },
      ],
    },
  },
  {
    title: 'Schedule reliability',
    kind: 'count',
    stacked: true,
    series: [
      { key: 'cancelled_visits', label: 'Cancelled visits', type: 'bar', color: C.red },
      { key: 'late_arrivals', label: 'Late arrivals', type: 'bar', color: C.orange },
    ],
  },
  {
    title: 'Client feedback',
    kind: 'decimal',
    rightKind: 'count',
    domain: [0, 5],
    series: [
      { key: 'feedback_responses', label: 'Responses', type: 'bar', color: C.softBlue, axis: 'right' },
      { key: 'feedback_score', label: 'Score (out of 5)', type: 'line', color: C.blue },
    ],
  },
]

function ManagerHistory() {
  const { state, version } = usePeriod()
  const [grain, setGrain] = useState('month')
  const { data, error } = useFetch(`/api/insights/manager/history/${queryString({ grain, division: state.division || undefined })}`, version)
  const byKeySeries = Object.fromEntries((data?.series || []).map((s) => [s.key, s]))
  const titles = (data?.titles || []).map((label) => splitLabel(label).name)
  const toggle = (
    <div className="seg">
      {[
        ['month', '12 months'],
        ['week', '12 weeks'],
      ].map(([key, label]) => (
        <button key={key} type="button" className={grain === key ? 'active' : ''} onClick={() => setGrain(key)}>
          {label}
        </button>
      ))}
    </div>
  )
  return (
    <Panel title="Performance history" subtitle={`The last 12 completed ${grain === 'week' ? 'weeks (Sunday to Saturday)' : 'months'}. Hover a bar or point for the exact value.`} actions={toggle}>
      {error ? <div className="notice">{error}</div> : null}
      {!data && !error ? <SkeletonCharts /> : null}
      {data ? (
        <div className="mgr-charts">
          {CHARTS.map((config) => {
            const chart = grain === 'week' && config.week ? config.week : config
            const series = chart.series
              .filter((s) => byKeySeries[s.key] && !(s.monthOnly && grain === 'week'))
              .map((s) => ({ ...s, points: byKeySeries[s.key].points }))
            // Some figures only exist from a certain date (complaints from Aug 2026): say so under the chart.
            const since = series
              .map((s) => ({ label: s.label, first: s.points.findIndex((p) => p != null) }))
              .filter(({ first }) => first > 0)
              .map(({ label, first }) => `${label} tracked from ${data.labels[first]}`)
            return (
              <div key={config.title} className="mgr-chart">
                <h4>
                  {grain === 'week' && chart.weekTitle ? chart.weekTitle : chart.title}
                  {chart.subtitle ? <small> · {chart.subtitle}</small> : null}
                </h4>
                <HistoryChart
                  title={chart.title}
                  labels={data.labels}
                  titles={titles}
                  series={series}
                  kind={chart.kind}
                  rightKind={chart.rightKind}
                  stacked={chart.stacked}
                  domain={chart.domain}
                  note={since.length ? `${since.join('; ')}.` : null}
                />
              </div>
            )
          })}
        </div>
      ) : null}
    </Panel>
  )
}

const TV_REFRESH_MS = 5 * 60 * 1000

function fullscreen(on) {
  try {
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.()?.catch?.(() => {})
    if (!on && document.fullscreenElement) document.exitFullscreen?.()?.catch?.(() => {})
  } catch {
    // Some TV browsers have no full-screen support: the page still fills the window.
  }
}

/** TV view: the page alone on a wall screen. The address ends in ?tv=1 so a TV can bookmark it. */
function useTvMode() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const tv = new URLSearchParams(search).get('tv') === '1'
  const enter = useCallback(() => {
    fullscreen(true) // inside the click: browsers only allow full screen from one
    navigate(`${pathname}?tv=1`)
  }, [navigate, pathname])
  const exit = useCallback(() => {
    fullscreen(false)
    navigate(pathname)
  }, [navigate, pathname])
  // Left TV view another way (browser Back, a link): leave full screen too.
  useEffect(() => {
    if (!tv) fullscreen(false)
  }, [tv])
  return { tv, enter, exit }
}

const pad = (n) => String(n).padStart(2, '0')
const timeOf = (date) => date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })

/** Seconds ticking. Also runs the TV refresh: every 5 minutes after the data on screen arrived. */
function useTicker(loadedAt, onRefresh) {
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [triedAt, setTriedAt] = useState(0) // a failed refresh still waits 5 minutes before the next try
  const nextAt = Math.max(loadedAt ? loadedAt.getTime() : 0, triedAt, startedAt) + TV_REFRESH_MS
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= nextAt) {
        setTriedAt(t)
        onRefresh()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [nextAt, onRefresh])
  return { now: new Date(now), left: Math.max(0, nextAt - now) }
}

function RefreshRing({ left }) {
  const size = 44
  const r = 18
  const c = 2 * Math.PI * r
  const seconds = Math.ceil(left / 1000)
  return (
    <div className="tv-refresh" title="The numbers reload by themselves every 5 minutes">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="tv-ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="tv-ring"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - left / TV_REFRESH_MS)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span>
        <b>
          {Math.floor(seconds / 60)}:{pad(seconds % 60)}
        </b>
        <small>next update</small>
      </span>
    </div>
  )
}

function TvClock({ loadedAt, onRefresh }) {
  const { now, left } = useTicker(loadedAt, onRefresh)
  const hours = now.getHours() % 12 || 12
  return (
    <div className="tv-clock" role="timer" aria-label={`${timeOf(now)}, next update in ${Math.ceil(left / 60000)} minutes`}>
      <div className="tv-time">
        <span className="tv-hm">
          {hours}
          <i>:</i>
          {pad(now.getMinutes())}
        </span>
        <span className="tv-side">
          <span className="tv-sec">{pad(now.getSeconds())}</span>
          <span className="tv-ampm">{now.getHours() < 12 ? 'AM' : 'PM'}</span>
        </span>
      </div>
      <div className="tv-date">{now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
      <RefreshRing left={left} />
    </div>
  )
}

function TvHeader({ period, loadedAt, onRefresh, onExit }) {
  const [isFull, setIsFull] = useState(() => Boolean(document.fullscreenElement))
  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  return (
    <header className="tv-header">
      <div className="tv-title">
        <h2>Manager overview</h2>
        <p className="muted">
          {period}
          {loadedAt ? ` · Updated ${timeOf(loadedAt)}` : ''}
        </p>
        <div className="tv-actions">
          {isFull ? null : (
            <button type="button" className="ghost tiny" onClick={() => fullscreen(true)}>
              Full screen
            </button>
          )}
          <button type="button" className="ghost tiny" onClick={onExit}>
            Exit TV view
          </button>
        </div>
      </div>
      <TvClock loadedAt={loadedAt} onRefresh={onRefresh} />
    </header>
  )
}

export function ManagerOverview() {
  const { tv, enter, exit } = useTvMode()
  const { data, loadedAt, openDrill, shell } = useMasterPage('/api/insights/manager/', { bare: tv })
  // On the TV the numbers keep themselves current (TvClock reloads them); old ones stay on screen meanwhile.
  const { state, update, reload } = usePeriod()
  const staff = data?.staffing
  const isLastWeek = state.kind === 'week' && state.anchor === data?.last_completed_week
  const quick = (
    <div className="manager-actions">
      <div className="seg manager-quick">
        <button type="button" className={state.kind === 'month' && !state.anchor ? 'active' : ''} onClick={() => update({ kind: 'month', anchor: '' })}>
          Month to date
        </button>
        <button type="button" className={isLastWeek ? 'active' : ''} disabled={!data} onClick={() => update({ kind: 'week', anchor: data.last_completed_week })}>
          Last completed week
        </button>
      </div>
      {tv ? null : (
        <button type="button" className="ghost tiny tv-button" onClick={enter} title="Show this page full screen, for a TV">
          ⛶ TV view
        </button>
      )}
    </div>
  )
  return shell(
    <>
      {tv ? <TvHeader period={data?.period?.label} loadedAt={loadedAt} onRefresh={reload} onExit={exit} /> : null}
      <Panel title="Business overview" subtitle={`${data?.period?.label || ''}. Click a number to see the records behind it.`} actions={quick}>
        <Headline cards={data?.headline} onDrill={openDrill} />
        <AttentionStrip attention={data?.attention} staff={staff} capacity={data?.capacity} onDrill={openDrill} />
      </Panel>
      <RevenueTarget target={data?.target} onDrill={openDrill} />
      <Staffing staff={staff} capacity={data?.capacity} />
      <Capacity capacity={data?.capacity} onDrill={openDrill} />
      {data ? <Lists data={data} onDrill={openDrill} /> : null}
      <ManagerHistory />
    </>,
  )
}
