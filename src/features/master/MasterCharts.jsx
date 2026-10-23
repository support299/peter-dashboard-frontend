import { useState } from 'react'
import { queryString } from '../../lib'
import { formatValue } from './format'
import { useFetch, usePeriod } from './periodState'

const W = 720
const H = 240
const PAD = { l: 16, r: 16, t: 26, b: 38 }

/** Column chart for one trend series; missing data shows as "n/a", never as zero. */
export function TrendChart({ points = [], kind = 'currency', color = 'var(--accent)' }) {
  const [hover, setHover] = useState(null)
  if (!points.length) return <p className="muted empty">No data yet.</p>
  const values = points.map((p) => (p.value == null ? null : Number(p.value)))
  const max = Math.max(1, ...values.filter((v) => v != null).map((v) => Math.abs(v)))
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const slot = innerW / points.length
  const barW = Math.max(4, Math.min(48, slot * 0.62))
  const every = Math.ceil(points.length / 14)

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trend chart">
        <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH} y2={PAD.t + innerH} className="axis" />
        {points.map((point, index) => {
          const x = PAD.l + slot * index + (slot - barW) / 2
          const value = values[index]
          const h = value == null ? 0 : (Math.abs(value) / max) * innerH
          return (
            <g key={point.start || point.label} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
              <rect x={PAD.l + slot * index} y={PAD.t} width={slot} height={innerH} fill="transparent" />
              {value == null ? (
                <text x={x + barW / 2} y={PAD.t + innerH - 6} textAnchor="middle" className="na">
                  n/a
                </text>
              ) : (
                <rect x={x} y={PAD.t + innerH - h} width={barW} height={Math.max(h, 1)} rx="3" fill={color} opacity={hover === null || hover === index ? 1 : 0.45} />
              )}
              {index % every === 0 || index === points.length - 1 ? (
                <text x={x + barW / 2} y={H - 14} textAnchor="middle" className="tick">
                  {point.label}
                </text>
              ) : null}
            </g>
          )
        })}
        {hover != null ? (
          <text x={W / 2} y={16} textAnchor="middle" className="hover-label">
            {points[hover].label}: {values[hover] == null ? 'no data' : formatValue(kind, values[hover])}
          </text>
        ) : null}
      </svg>
    </div>
  )
}

const RANGES = [
  { key: '12m', label: '12 months' },
  { key: '3y', label: '3 years' },
  { key: '5y', label: '5 years' },
  { key: 'lifetime', label: 'Lifetime' },
]
const GRAINS = [
  { key: '', label: 'Auto' },
  { key: 'month', label: 'Monthly' },
  { key: 'quarter', label: 'Quarterly' },
  { key: 'year', label: 'Yearly' },
]

export function TrendPanel({ title = 'Trend', metrics, initial }) {
  const { state } = usePeriod()
  const [metric, setMetric] = useState(initial || metrics[0].key)
  const [range, setRange] = useState('12m')
  const [grain, setGrain] = useState('')
  const { data: payload, error } = useFetch(`/api/insights/trend/${queryString({ metric, range, grain, division: state.division })}`)
  const data = payload?.series?.[0] || null

  return (
    <article className="master-panel">
      <header className="master-panel-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">Year-over-year view. Click the range to go back further.</p>
        </div>
        <div className="trend-controls">
          {metrics.length > 1 ? (
            <select aria-label="Metric" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {metrics.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : null}
          <div className="seg">
            {RANGES.map((item) => (
              <button key={item.key} type="button" className={range === item.key ? 'active' : ''} onClick={() => setRange(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          <select aria-label="Group by" value={grain} onChange={(e) => setGrain(e.target.value)}>
            {GRAINS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>
      {error ? <div className="notice">{error}</div> : null}
      {data && !data.available ? <p className="muted empty">{data.note || 'Not available yet.'}</p> : null}
      {data?.available ? <TrendChart points={data.points} kind={data.kind} /> : null}
      {!data && !error ? <p className="muted empty">Loading…</p> : null}
    </article>
  )
}

/** Starting MRR → +new → +expansion → −churn … → Ending MRR. */
export function Waterfall({ steps = [], onSelect }) {
  if (!steps.length) return <p className="muted empty">No recurring revenue data for this period.</p>
  const bars = steps.reduce((out, step) => {
    const value = step.value == null ? null : Number(step.value)
    const running = out.length ? out[out.length - 1].to : 0
    if (step.type === 'total') return [...out, { ...step, value, from: 0, to: value || 0 }]
    return [...out, { ...step, value, from: running, to: running + (value || 0) }]
  }, [])
  const max = Math.max(1, ...bars.flatMap((b) => [b.from, b.to]))
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const slot = innerW / bars.length
  const barW = Math.min(64, slot * 0.6)
  const y = (v) => PAD.t + innerH - (v / max) * innerH

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="MRR waterfall">
        <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH} y2={PAD.t + innerH} className="axis" />
        {bars.map((bar, index) => {
          const x = PAD.l + slot * index + (slot - barW) / 2
          const top = y(Math.max(bar.from, bar.to))
          const height = Math.max(1, Math.abs(y(bar.from) - y(bar.to)))
          const cls = bar.type === 'total' ? 'wf-total' : bar.value == null ? 'wf-na' : bar.value >= 0 ? 'wf-up' : 'wf-down'
          return (
            <g key={bar.key} className={onSelect && bar.type !== 'total' ? 'wf-click' : ''} onClick={() => onSelect && bar.type !== 'total' && bar.value != null && onSelect(bar)}>
              {bar.value == null ? (
                <text x={x + barW / 2} y={y(bar.from) - 6} textAnchor="middle" className="na">
                  n/a
                </text>
              ) : (
                <rect x={x} y={top} width={barW} height={height} rx="3" className={cls} />
              )}
              {bar.value != null ? (
                <text x={x + barW / 2} y={top - 6} textAnchor="middle" className="wf-value">
                  {bar.type === 'total' ? '' : bar.value >= 0 ? '+' : '−'}
                  {formatValue('currency', Math.abs(bar.value))}
                </text>
              ) : null}
              <text x={x + barW / 2} y={H - 14} textAnchor="middle" className="tick">
                {bar.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
