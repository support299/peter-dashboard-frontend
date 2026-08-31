import { AreaChart, Donut, JOBBER_COLORS, SegmentedBar } from '../../components/charts'
import { AnimatedMetric } from '../dashboard/metrics'
import { JOBBER_KPI_META, JOBBER_STRIP_ICONS, JOBBER_TOP_ICONS, RevenueIcon } from './icons'
import { JobberSpark } from './JobberSpark'
import { VisitTable } from './VisitTable'

export function Overview({ dash, onKpi, onDetail }) {
  const kpis = dash.kpis || []
  const hero = kpis.find((kpi) => kpi.key === 'revenue')
  const outstanding = kpis.find((kpi) => kpi.key === 'outstanding')
  const clients = kpis.find((kpi) => kpi.key === 'clients')
  const visits = kpis.find((kpi) => kpi.key === 'visits')
  const topStats = [outstanding, clients, visits].filter(Boolean)
  const opsKeys = ['cancelled', 'cancelled_jobs', 'one_off', 'recurring', 'first_cleans', 'deep_cleans', 'new_recurring', 'avg_price']
  const ops = opsKeys.map((key) => kpis.find((kpi) => kpi.key === key)).filter(Boolean)
  const used = new Set(['revenue', 'outstanding', 'clients', 'visits', ...opsKeys])
  const rest = kpis.filter((kpi) => !used.has(kpi.key))

  const invoiceRows = (dash.charts?.invoices || []).map((row) => ({
    ...row,
    value: row.count,
    revenue: row.amount,
  }))

  return (
    <div className="jobber-board">
      <section className="jobber-top-grid">
        {hero ? (
          <button
            type="button"
            className="jobber-hero-card anim-rise"
            style={{ '--delay': '40ms' }}
            onClick={() => onKpi(hero.view, hero.filters || {})}
          >
            <div className="jobber-hero-main">
              <div className="jobber-hero-icon-wrap">
                <RevenueIcon />
              </div>
              <div>
                <span className="jobber-eyebrow">Invoice revenue (ex tax)</span>
                <AnimatedMetric kpi={hero} delay={40} />
                <p>{JOBBER_KPI_META.revenue.hint}</p>
              </div>
            </div>
            <JobberSpark data={dash.charts?.revenue || []} />
          </button>
        ) : null}

        {topStats.map((kpi, index) => {
          const meta = JOBBER_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
          const Icon = JOBBER_TOP_ICONS[kpi.key]
          return (
            <button
              key={kpi.key}
              type="button"
              className={`jobber-stat tone-${meta.tone} anim-rise`}
              style={{ '--delay': `${120 + index * 70}ms` }}
              onClick={() => onKpi(kpi.view, kpi.filters || {})}
            >
              <div className="jobber-stat-top">
                <span>{kpi.label}</span>
                {Icon ? (
                  <span className={`jobber-icon-wrap ${kpi.key}`}>
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

      {ops.length ? (
        <section className="jobber-strip ops-strip">
          {ops.map((kpi, index) => {
            const meta = JOBBER_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
            const Icon = JOBBER_STRIP_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`jobber-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${280 + index * 50}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="jobber-stat-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`jobber-icon-wrap strip ${kpi.key}`}>
                      <Icon />
                    </span>
                  ) : null}
                </div>
                <AnimatedMetric kpi={kpi} delay={280 + index * 50} />
              </button>
            )
          })}
        </section>
      ) : null}

      {rest.length ? (
        <section className="jobber-strip">
          {rest.map((kpi, index) => {
            const meta = JOBBER_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
            const Icon = JOBBER_STRIP_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`jobber-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${520 + index * 40}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="jobber-stat-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`jobber-icon-wrap strip ${kpi.key}`}>
                      <Icon />
                    </span>
                  ) : null}
                </div>
                <AnimatedMetric kpi={kpi} delay={520 + index * 40} />
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="jobber-bento">
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '420ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Revenue by month</h3>
              <p>Invoice totals · click a month to filter</p>
            </div>
          </header>
          <AreaChart
            valueLabel="Revenue"
            data={dash.charts?.revenue || []}
            onSelect={(point) => {
              if (!point.month) return
              const [year, month] = point.month.split('-').map(Number)
              const start = `${point.month}-01`
              const endDate = new Date(year, month, 1)
              onKpi('invoices', { from: start, to: endDate.toISOString().slice(0, 10) })
            }}
          />
        </article>

        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '500ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Visit mix</h3>
              <p>Recurring vs one-off and more</p>
            </div>
          </header>
          <SegmentedBar
            colors={JOBBER_COLORS}
            data={dash.charts?.mix || []}
            onSelect={(item) => onKpi('visits', { type: item.key })}
          />
        </article>

        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '580ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Visits by month</h3>
              <p>Volume trend · click a month to open visits</p>
            </div>
          </header>
          <AreaChart
            color="#2563eb"
            valueLabel="Visits"
            data={dash.charts?.visits || []}
            onSelect={(point) => {
              if (!point.month) return
              const [year, month] = point.month.split('-').map(Number)
              const start = `${point.month}-01`
              const endDate = new Date(year, month, 1)
              onKpi('visits', { from: start, to: endDate.toISOString().slice(0, 10) })
            }}
          />
        </article>

        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '660ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Invoices</h3>
              <p>Status mix · pie view</p>
            </div>
          </header>
          <Donut
            data={invoiceRows}
            onSelect={(item) => onKpi('invoices', { status: item.key })}
          />
        </article>

        <article className="jobber-panel span-12 list-panel anim-rise" style={{ '--delay': '740ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Recent visits</h3>
              <p>Latest work from Jobber</p>
            </div>
            <button className="ghost tiny" type="button" onClick={() => onKpi('visits', {})}>
              View all
            </button>
          </header>
          <VisitTable rows={dash.recent_visits || []} onOpen={(id) => onDetail('visits', id)} />
        </article>
      </section>
    </div>
  )
}
