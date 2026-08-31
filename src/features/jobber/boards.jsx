import { AreaChart, JOBBER_COLORS, RankBars, SegmentedBar } from '../../components/charts'
import { money, number, when } from '../../lib'
import { BoardKpiStrip } from '../dashboard/BoardKpiStrip'

export function OneOffBoard({ dash, onKpi }) {
  if (!dash) return <p className="empty muted">Loading…</p>
  return (
    <div className="jobber-board">
      <BoardKpiStrip kpis={dash.kpis || []} onKpi={onKpi} />
      <section className="jobber-bento">
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '180ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>By service type</h3>
              <p>Job count mix</p>
            </div>
          </header>
          <SegmentedBar colors={JOBBER_COLORS} data={dash.charts?.by_type || dash.by_service_type || []} />
        </article>
        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '240ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Revenue by type</h3>
              <p>Ranked one-off revenue</p>
            </div>
          </header>
          <RankBars valueLabel="Revenue" data={dash.charts?.revenue_by_type || []} />
        </article>
        <article className="jobber-panel span-12 anim-rise" style={{ '--delay': '300ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Service type breakdown</h3>
              <p>Count, revenue, and average price</p>
            </div>
          </header>
          <table className="table">
            <thead>
              <tr>
                <th>Service type</th>
                <th>Jobs</th>
                <th>Revenue</th>
                <th>Avg price</th>
              </tr>
            </thead>
            <tbody>
              {(dash.by_service_type || []).map((row) => (
                <tr key={row.key || row.label}>
                  <td>{row.label}</td>
                  <td>{number(row.count ?? row.value)}</td>
                  <td>{money(row.revenue)}</td>
                  <td>{money(row.avg_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  )
}

export function CancellationsBoard({ dash, onKpi }) {
  if (!dash) return <p className="empty muted">Loading…</p>
  return (
    <div className="jobber-board">
      <BoardKpiStrip kpis={dash.kpis || []} onKpi={onKpi} />
      <section className="jobber-bento">
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '180ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Cancelled visits by month</h3>
              <p>Value trend</p>
            </div>
          </header>
          <AreaChart color="#d97706" valueLabel="Value" data={dash.charts?.visits_by_month || []} />
        </article>
        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '240ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Visits by division</h3>
              <p>Cancelled visit mix</p>
            </div>
          </header>
          <SegmentedBar colors={JOBBER_COLORS} data={dash.charts?.visits_by_division || []} />
        </article>
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '300ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Cancelled jobs by month</h3>
              <p>Lost revenue trend</p>
            </div>
          </header>
          <AreaChart color="#e11d48" valueLabel="Value" data={dash.charts?.jobs_by_month || []} />
        </article>
        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '360ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Jobs by division</h3>
              <p>Cancelled job mix</p>
            </div>
          </header>
          <RankBars valueLabel="Count" data={dash.charts?.jobs_by_division || []} />
        </article>
        <article className="jobber-panel span-12 list-panel anim-rise" style={{ '--delay': '420ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Recent cancellations</h3>
              <p>Latest cancelled visit and job events</p>
            </div>
          </header>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Division</th>
                <th>Value</th>
                <th>Lost</th>
              </tr>
            </thead>
            <tbody>
              {(dash.recent || []).map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="chip">{row.type}</span>
                  </td>
                  <td>{row.client || '—'}</td>
                  <td>{when(row.task_date)}</td>
                  <td>{row.division || '—'}</td>
                  <td>{money(row.value)}</td>
                  <td>{row.lost_client ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  )
}

export function CxBoard({ dash }) {
  if (!dash) return <p className="empty muted">Loading…</p>
  return (
    <div className="jobber-board">
      <BoardKpiStrip kpis={dash.kpis || []} />
      <section className="jobber-bento">
        <article className="jobber-panel span-6 anim-rise" style={{ '--delay': '180ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Recent feedback</h3>
              <p>Customer experience notes</p>
            </div>
          </header>
          <div className="cx-list">
            {(dash.recent_feedback || []).length ? (
              dash.recent_feedback.map((row) => (
                <div className="cx-item" key={row.id}>
                  <div className="cx-item-top">
                    <strong>{row.client || 'Customer'}</strong>
                    <span>{row.rating != null ? `${row.rating}★` : '—'}</span>
                  </div>
                  <p>{row.text || 'No comment'}</p>
                  <span className="hint">
                    {when(row.received_at)} · {row.responded ? 'Responded' : 'Open'}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty muted">No feedback yet.</p>
            )}
          </div>
        </article>
        <article className="jobber-panel span-6 anim-rise" style={{ '--delay': '240ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Google reviews</h3>
              <p>Latest public ratings</p>
            </div>
          </header>
          <div className="cx-list">
            {(dash.recent_reviews || []).length ? (
              dash.recent_reviews.map((row) => (
                <div className="cx-item" key={row.id}>
                  <div className="cx-item-top">
                    <strong>{row.author || 'Reviewer'}</strong>
                    <span>{row.rating != null ? `${row.rating}★` : '—'}</span>
                  </div>
                  <p>{row.text || 'No comment'}</p>
                  <span className="hint">
                    {when(row.reviewed_at)} · {row.replied ? 'Replied' : 'No reply'}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty muted">No reviews yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
