import { AnimatedMetric } from './metrics'
import { JOBBER_KPI_META } from '../jobber/icons'

export function BoardKpiStrip({ kpis = [], onKpi }) {
  if (!kpis.length) return null
  return (
    <section className="jobber-strip ops-strip">
      {kpis.map((kpi, index) => {
        const meta = JOBBER_KPI_META[kpi.key] || { tone: 'teal', hint: '' }
        return (
          <button
            key={kpi.key}
            type="button"
            className={`jobber-strip-card tone-${meta.tone} anim-rise`}
            style={{ '--delay': `${80 + index * 50}ms` }}
            onClick={() => (onKpi && kpi.view ? onKpi(kpi.view, kpi.filters || {}) : undefined)}
          >
            <div className="jobber-stat-top">
              <span>{kpi.label}</span>
            </div>
            <AnimatedMetric kpi={kpi} delay={80 + index * 50} />
          </button>
        )
      })}
    </section>
  )
}
