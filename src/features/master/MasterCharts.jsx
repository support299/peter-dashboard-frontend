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

const PROFIT_SERIES = [
  { key: 'revenue', color: 'var(--accent)' },
  { key: 'gross_profit', color: '#0d9488' },
  { key: 'net_profit', color: '#7c3aed' },
]

/** Side-by-side columns around a zero line, so a loss goes below it. Missing data draws nothing. */
function CompareChart({ series, kind = 'currency' }) {
  const [hover, setHover] = useState(null)
  const points = series[0]?.points || []
  if (!points.length) return <p className="muted empty">No data yet.</p>
  const number = (value) => (value == null ? null : Number(value))
  const all = series.flatMap((s) => s.points.map((p) => number(p.value))).filter((v) => v != null)
  const top = Math.max(1, ...all)
  const bottom = Math.min(0, ...all)
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const y = (value) => PAD.t + ((top - value) / (top - bottom)) * innerH
  const slot = innerW / points.length
  const barW = Math.max(2, Math.min(18, (slot * 0.74) / series.length))
  const every = Math.ceil(points.length / 14)
  const hovered = hover == null ? [] : series.map((s) => `${s.label} ${s.points[hover].value == null ? 'n/a' : formatValue(kind, s.points[hover].value)}`)

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Revenue, gross profit and net profit">
        {points.map((point, index) => {
          const left = PAD.l + slot * index + (slot - barW * series.length) / 2
          return (
            <g key={point.start || point.label} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
              <rect x={PAD.l + slot * index} y={PAD.t} width={slot} height={innerH} fill="transparent" />
              {series.map((s, n) => {
                const value = number(s.points[index]?.value)
                if (value == null) return null
                const height = Math.max(Math.abs(y(value) - y(0)), 1)
                return <rect key={s.metric} x={left + barW * n} y={value >= 0 ? y(0) - height : y(0)} width={Math.max(barW - 1, 1)} height={height} fill={s.color} opacity={hover === null || hover === index ? 1 : 0.45} />
              })}
              {index % every === 0 || index === points.length - 1 ? (
                <text x={PAD.l + slot * index + slot / 2} y={H - 14} textAnchor="middle" className="tick">
                  {point.label}
                </text>
              ) : null}
            </g>
          )
        })}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} className="axis" />
        {hover != null ? (
          <text x={W / 2} y={16} textAnchor="middle" className="hover-label">
            {points[hover].label}: {hovered.join(' · ')}
          </text>
        ) : null}
      </svg>
    </div>
  )
}

export function ProfitComparePanel() {
  const { state, version } = usePeriod()
  const [range, setRange] = useState('12m')
  const metrics = PROFIT_SERIES.map((s) => s.key).join(',')
  const { data: payload, error } = useFetch(`/api/insights/trend/${queryString({ metrics, range, division: state.division })}`, version)
  const all = (payload?.series || []).map((s) => ({ ...s, color: PROFIT_SERIES.find((p) => p.key === s.metric)?.color }))
  const series = all.filter((s) => s.available)
  const note = all.find((s) => !s.available)?.note

  return (
    <article className="master-panel">
      <header className="master-panel-head">
        <div>
          <h3>Revenue vs profit</h3>
          <p className="muted">Gross and net profit appear from the first month with expenses in Financials.</p>
        </div>
        <div className="trend-controls">
          <div className="seg">
            {RANGES.map((item) => (
              <button key={item.key} type="button" className={range === item.key ? 'active' : ''} onClick={() => setRange(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      {error ? <div className="notice">{error}</div> : null}
      {note ? <p className="muted tiny-text">{note}</p> : null}
      {series.length ? (
        <>
          <ul className="compare-legend">
            {series.map((s) => (
              <li key={s.metric}>
                <i style={{ background: s.color }} />
                {s.label}
              </li>
            ))}
          </ul>
          <CompareChart series={series} />
        </>
      ) : null}
      {!payload && !error ? <p className="muted empty">Loading…</p> : null}
    </article>
  )
}

const WF = { w: 1100, h: 330, l: 64, r: 16, t: 40, b: 58 }

function compactMoney(value) {
  const abs = Math.abs(value)
  if (abs >= 1000) return `$${(value / 1000).toFixed(abs >= 100000 ? 0 : 1)}k`
  return `$${Math.round(value)}`
}

/** Two short lines instead of one long label ("Paused /" + "resumed"). */
function labelLines(label) {
  if (label.length <= 12) return [label]
  const words = label.split(' ')
  const half = Math.ceil(words.length / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')]
}

/**
 * Starting MRR → +new → +expansion → −churn … → Ending MRR.
 * The axis starts just below the lowest level (not at $0) so month-to-month
 * changes, which are small next to total MRR, are visible.
 */
export function Waterfall({ steps = [], onSelect }) {
  if (!steps.length) return <p className="muted empty">No recurring revenue data for this period.</p>
  const bars = steps.reduce((out, step) => {
    const value = step.value == null ? null : Number(step.value)
    const running = out.length ? out[out.length - 1].to : 0
    if (step.type === 'total') return [...out, { ...step, value, from: 0, to: value || 0 }]
    return [...out, { ...step, value, from: running, to: running + (value || 0) }]
  }, [])
  const levels = bars.flatMap((b) => (b.type === 'total' ? [b.to] : [b.from, b.to]))
  const hi = Math.max(...levels)
  const lo = Math.min(...levels)
  const span = Math.max(hi - lo, Math.abs(hi) * 0.02, 1)
  const floor = Math.max(0, lo - span * 1.5)
  const ceil = hi + span * 0.25
  const innerW = WF.w - WF.l - WF.r
  const innerH = WF.h - WF.t - WF.b
  const slot = innerW / bars.length
  const barW = Math.min(72, slot * 0.56)
  const y = (v) => WF.t + innerH - ((v - floor) / (ceil - floor)) * innerH
  const ticks = [0, 1, 2, 3].map((i) => floor + ((ceil - floor) * i) / 3)

  return (
    <div className="trend-chart waterfall">
      <svg viewBox={`0 0 ${WF.w} ${WF.h}`} role="img" aria-label="MRR waterfall">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={WF.l} x2={WF.w - WF.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={WF.l - 8} y={y(t) + 4} textAnchor="end" className="tick">
              {compactMoney(t)}
            </text>
          </g>
        ))}
        {floor > 0 ? (
          <text x={WF.l} y={16} className="tick">
            Axis starts at {compactMoney(floor)} so the changes are visible
          </text>
        ) : null}
        {bars.map((bar, index) => {
          const x = WF.l + slot * index + (slot - barW) / 2
          const base = bar.type === 'total' ? floor : bar.from
          const top = y(Math.max(base, bar.to))
          const height = Math.max(2, Math.abs(y(base) - y(bar.to)))
          const cls = bar.type === 'total' ? 'wf-total' : bar.value == null ? 'wf-na' : bar.value >= 0 ? 'wf-up' : 'wf-down'
          const next = bars[index + 1]
          const clickable = onSelect && bar.type !== 'total' && bar.value != null
          return (
            <g key={bar.key} className={clickable ? 'wf-click' : ''} onClick={() => clickable && onSelect(bar)}>
              {next ? (
                <line x1={x + barW} x2={x + slot} y1={y(bar.to)} y2={y(bar.to)} className="wf-connector" />
              ) : null}
              {bar.value == null ? (
                <text x={x + barW / 2} y={y(bar.from) - 8} textAnchor="middle" className="na">
                  n/a
                </text>
              ) : (
                <rect x={x} y={top} width={barW} height={height} rx="4" className={cls} />
              )}
              {bar.value != null ? (
                <text x={x + barW / 2} y={top - 8} textAnchor="middle" className="wf-value">
                  {bar.type === 'total' ? '' : bar.value > 0 ? '+' : bar.value < 0 ? '−' : ''}
                  {formatValue('currency', Math.abs(bar.value))}
                </text>
              ) : null}
              <text x={x + barW / 2} y={WF.h - 34} textAnchor="middle" className="wf-label">
                {labelLines(bar.label).map((line, i) => (
                  <tspan key={line} x={x + barW / 2} dy={i ? 15 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
