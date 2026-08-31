import { ColumnChart, INTERNAL_COLORS, RankBars, SegmentedBar } from '../../components/charts'
import { AnimatedMetric } from '../dashboard/metrics'
import { INTERNAL_KPI_META, INTERNAL_STRIP_ICONS, INTERNAL_TOP_ICONS, TeamIcon } from './icons'
import { RoleSpark } from './RoleSpark'
import { LeaveTable } from './tables'

export function InternalOverview({ dash, onKpi }) {
  const kpis = dash.kpis || []
  const hero = kpis.find((kpi) => kpi.key === 'headcount_active')
  const leavePending = kpis.find((kpi) => kpi.key === 'leave_pending')
  const bonus = kpis.find((kpi) => kpi.key === 'bonus_total')
  const lockins = kpis.find((kpi) => kpi.key === 'pending_lock_ins')
  const topStats = [leavePending, bonus, lockins].filter(Boolean)
  const rest = kpis.filter((kpi) => !['headcount_active', 'leave_pending', 'bonus_total', 'pending_lock_ins'].includes(kpi.key))

  const leaveStatus = (dash.charts?.leave_status || []).map((row) => ({ ...row, value: row.count }))
  const leaveType = (dash.charts?.leave_type || []).map((row) => ({ ...row, value: row.count }))
  const roles = (dash.charts?.roles || []).map((row) => ({ ...row, value: row.count }))
  const positions = (dash.charts?.positions || []).map((row) => ({ ...row, value: row.count }))
  const bonusStatus = (dash.charts?.bonus_status || []).map((row) => ({
    ...row,
    value: row.count,
    revenue: row.amount,
  }))

  return (
    <div className="internal-board">
      <section className="internal-top-grid">
        {hero ? (
          <button
            type="button"
            className="internal-hero-card anim-rise"
            style={{ '--delay': '40ms' }}
            onClick={() => onKpi(hero.view, hero.filters || {})}
          >
            <div className="internal-hero-main">
              <div className="internal-hero-icon-wrap">
                <TeamIcon />
              </div>
              <div>
                <span className="internal-eyebrow">Workforce</span>
                <AnimatedMetric kpi={hero} delay={40} />
                <p>{INTERNAL_KPI_META.headcount_active.hint}</p>
              </div>
            </div>
            <RoleSpark data={dash.charts?.roles || []} />
          </button>
        ) : null}

        {topStats.map((kpi, index) => {
          const meta = INTERNAL_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
          const Icon = INTERNAL_TOP_ICONS[kpi.key]
          return (
            <button
              key={kpi.key}
              type="button"
              className={`internal-stat tone-${meta.tone} anim-rise`}
              style={{ '--delay': `${120 + index * 70}ms` }}
              onClick={() => onKpi(kpi.view, kpi.filters || {})}
            >
              <div className="internal-stat-top">
                <span>{kpi.label}</span>
                {Icon ? (
                  <span className={`internal-icon-wrap ${kpi.key}`}>
                    <Icon />
                  </span>
                ) : null}
              </div>
              <AnimatedMetric kpi={kpi} delay={120 + index * 70} />
              <em>{meta.hint}</em>
            </button>
          )
        })}
      </section>

      {rest.length ? (
        <section className="internal-strip">
          {rest.map((kpi, index) => {
            const meta = INTERNAL_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
            const Icon = INTERNAL_STRIP_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`internal-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${320 + index * 50}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="internal-stat-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`internal-icon-wrap strip ${kpi.key}`}>
                      <Icon />
                    </span>
                  ) : null}
                </div>
                <AnimatedMetric kpi={kpi} delay={320 + index * 50} />
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="internal-bento">
        <article className="internal-panel span-7 anim-rise" style={{ '--delay': '420ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Leave by type</h3>
              <p>Column mix · click to filter</p>
            </div>
          </header>
          <ColumnChart
            color="#0f766e"
            valueLabel="Count"
            data={leaveType}
            onSelect={(item) => onKpi('leave', { leave_type: item.key })}
          />
        </article>

        <article className="internal-panel span-5 anim-rise" style={{ '--delay': '500ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Leave status</h3>
              <p>Segmented pipeline</p>
            </div>
          </header>
          <SegmentedBar
            colors={INTERNAL_COLORS}
            data={leaveStatus}
            onSelect={(item) => onKpi('leave', { status: item.key })}
          />
        </article>

        <article className="internal-panel span-5 anim-rise" style={{ '--delay': '580ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Team by role</h3>
              <p>Headcount ranking</p>
            </div>
          </header>
          <RankBars
            valueLabel="People"
            data={roles}
            onSelect={(item) => onKpi('employees', { role: item.key })}
          />
        </article>

        <article className="internal-panel span-7 anim-rise" style={{ '--delay': '640ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Bonus pipeline</h3>
              <p>Status mix with amounts</p>
            </div>
          </header>
          <SegmentedBar
            colors={['#2563eb', '#0f766e', '#f59e0b', '#e11d48', '#64748b']}
            data={bonusStatus}
            onSelect={(item) => onKpi('bonuses', { status: item.key })}
          />
        </article>

        <article className="internal-panel span-8 anim-rise" style={{ '--delay': '700ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Positions</h3>
              <p>Where people sit in the org</p>
            </div>
          </header>
          <ColumnChart
            color="#2563eb"
            valueLabel="Count"
            data={positions}
            onSelect={(item) => onKpi('employees', { position: item.key })}
          />
        </article>

        <article className="internal-panel span-4 alerts-panel anim-rise" style={{ '--delay': '760ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Alerts</h3>
              <p>Active hub notices</p>
            </div>
          </header>
          {dash.alerts?.length ? (
            <div className="alert-list">
              {dash.alerts.map((alert, index) => (
                <div className="alert-item anim-rise" key={alert.id} style={{ '--delay': `${800 + index * 70}ms` }}>
                  <span className="alert-dot" />
                  <p>{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty muted">No active alerts.</p>
          )}
        </article>

        <article className="internal-panel span-12 list-panel anim-rise" style={{ '--delay': '820ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Recent leave</h3>
              <p>Latest requests in your DB</p>
            </div>
            <button className="ghost tiny" type="button" onClick={() => onKpi('leave', {})}>
              View all
            </button>
          </header>
          <LeaveTable rows={(dash.recent_leave || []).slice(0, 8)} compact />
        </article>
      </section>
    </div>
  )
}
