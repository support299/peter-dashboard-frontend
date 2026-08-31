import { ColumnChart, RankBars, SegmentedBar } from '../../components/charts'
import { number } from '../../lib'
import { AnimatedMetric } from '../dashboard/metrics'
import { MoneyIcon, PRICING_KPI_META, STRIP_STAT_ICONS, TOP_STAT_ICONS } from './icons'
import { MiniSpark } from './MiniSpark'
import { PricingSubmissionTable } from './tables'

export function PricingOverview({ dash, onKpi, onOpen }) {
  const kpis = dash.kpis || []
  const hero = kpis.find((kpi) => kpi.key === 'revenue')
  const quotes = kpis.find((kpi) => kpi.key === 'submissions')
  const avg = kpis.find((kpi) => kpi.key === 'avg_quote')
  const pipeline = kpis.find((kpi) => kpi.key === 'pipeline')
  const approved = kpis.find((kpi) => kpi.key === 'approved')
  const approvalRate = kpis.find((kpi) => kpi.key === 'approval_rate')
  const rest = kpis.filter(
    (kpi) => !['revenue', 'submissions', 'avg_quote', 'pipeline', 'approved', 'approval_rate'].includes(kpi.key),
  )
  const topStats = [quotes, avg, pipeline].filter(Boolean)
  const approvalStrip = [approved, approvalRate].filter(Boolean)

  return (
    <div className="pricing-board">
      <section className="pricing-top-grid">
        {hero ? (
          <button
            type="button"
            className="pricing-revenue-card anim-rise"
            style={{ '--delay': '40ms' }}
            onClick={() => onKpi(hero.view, hero.filters || {})}
          >
            <div className="pricing-revenue-main">
              <div className="pricing-revenue-icon-wrap">
                <MoneyIcon />
              </div>
              <div>
                <span className="pricing-eyebrow">Quote volume</span>
                <AnimatedMetric kpi={hero} delay={40} />
                <p>{PRICING_KPI_META.revenue.hint}</p>
              </div>
            </div>
            <MiniSpark data={dash.charts?.monthly || []} />
          </button>
        ) : null}

        {topStats.map((kpi, index) => {
          const meta = PRICING_KPI_META[kpi.key] || { tone: 'cyan', hint: '' }
          const Icon = TOP_STAT_ICONS[kpi.key]
          return (
            <button
              key={kpi.key}
              type="button"
              className={`pricing-stat tone-${meta.tone} anim-rise`}
              style={{ '--delay': `${120 + index * 70}ms` }}
              onClick={() => onKpi(kpi.view, kpi.filters || {})}
            >
              <div className="pricing-stat-top">
                <span>{kpi.label}</span>
                {Icon ? (
                  <span className={`pricing-stat-icon-wrap ${kpi.key}`}>
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

      {approvalStrip.length || rest.length ? (
        <section className="pricing-strip">
          {[...approvalStrip, ...rest].map((kpi, index) => {
            const meta = PRICING_KPI_META[kpi.key] || { tone: 'ink', hint: '' }
            const Icon = STRIP_STAT_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`pricing-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${320 + index * 50}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="pricing-strip-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`pricing-stat-icon-wrap strip ${kpi.key}`}>
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

      <section className="pricing-bento">
        <article className="pricing-panel span-8 anim-rise" style={{ '--delay': '420ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Monthly quote volume</h3>
              <p>Column view · hover for revenue and count</p>
            </div>
          </header>
          <ColumnChart
            color="#0891b2"
            valueLabel="Revenue"
            data={dash.charts?.monthly || []}
            onSelect={(point) => {
              if (!point.month) return
              const [year, month] = point.month.split('-').map(Number)
              const start = `${point.month}-01`
              const end = new Date(year, month, 1).toISOString().slice(0, 10)
              onKpi('submissions', { from: start, to: end })
            }}
          />
        </article>

        <article className="pricing-panel span-4 anim-rise" style={{ '--delay': '500ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Status split</h3>
              <p>Segmented mix</p>
            </div>
          </header>
          <SegmentedBar data={dash.charts?.status || []} onSelect={(item) => onKpi('submissions', { status: item.key })} />
        </article>

        <article className="pricing-panel span-5 anim-rise" style={{ '--delay': '580ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Property mix</h3>
              <p>Counts by property type</p>
            </div>
          </header>
          <ColumnChart
            color="#f43f5e"
            valueLabel="Count"
            data={(dash.charts?.property || []).map((row) => ({ ...row, value: row.count || row.value }))}
            onSelect={(item) => onKpi('submissions', { property_type: item.key })}
          />
        </article>

        <article className="pricing-panel span-7 anim-rise" style={{ '--delay': '640ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Location leaderboard</h3>
              <p>Ranked by quote revenue</p>
            </div>
          </header>
          <RankBars
            valueLabel="Revenue"
            data={dash.charts?.locations || []}
            onSelect={(item) => onKpi('submissions', { location: item.key })}
          />
        </article>

        {dash.charts?.sales_by_source?.length ? (
          <article className="pricing-panel span-6 anim-rise" style={{ '--delay': '700ms' }}>
            <header className="pricing-panel-head">
              <div>
                <h3>Sales by source</h3>
                <p>Lead source revenue</p>
              </div>
            </header>
            <RankBars
              valueLabel="Revenue"
              data={dash.charts.sales_by_source}
              onSelect={(item) => onKpi('submissions', { source: item.key })}
            />
          </article>
        ) : null}

        <article className={`pricing-panel ${dash.charts?.sales_by_source?.length ? 'span-6' : 'span-4'} anim-rise`} style={{ '--delay': '740ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Catalog</h3>
              <p>Synced pricing objects</p>
            </div>
          </header>
          <div className="pricing-catalog">
            {Object.entries(dash.catalog_summary || {}).map(([key, value]) => (
              <button
                key={key}
                type="button"
                className="pricing-catalog-item"
                onClick={() => {
                  const map = {
                    services: 'services',
                    packages: 'packages',
                    locations: 'locations',
                    addons: 'addons',
                    coupons: 'coupons',
                    bundles: 'packages',
                  }
                  onKpi(map[key] || 'submissions', {})
                }}
              >
                <span>{key}</span>
                <strong>{number(value)}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="pricing-panel span-12 list-panel anim-rise" style={{ '--delay': '800ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Recent quotes</h3>
              <p>Latest stored submissions</p>
            </div>
            <button className="ghost tiny" type="button" onClick={() => onKpi('submissions', {})}>
              View all
            </button>
          </header>
          <PricingSubmissionTable rows={(dash.recent || []).slice(0, 6)} onOpen={(id) => onOpen('submissions', id)} compact />
        </article>
      </section>
    </div>
  )
}
