import { useState } from 'react'
import { number } from '../../lib'
import { formatValue } from './format'

const W = 360
const H = 200
const PAD = { t: 10, b: 24, l: 42, r: 10 }
const RIGHT_PAD = 40

const num = (value) => (value == null ? null : Number(value))

/** Axis tick labels: $43K, 4.5, 12. */
function compact(kind, value) {
  const n = Number(value)
  if (kind === 'currency') {
    const abs = Math.abs(n)
    const sign = n < 0 ? '−' : ''
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1).replace(/\.0$/, '')}M`
    if (abs >= 1e4) return `${sign}$${Math.round(abs / 1000)}K`
    if (abs >= 1e3) return `${sign}$${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`
    return `${sign}$${Math.round(abs)}`
  }
  if (kind === 'percent') return `${n}%`
  if (kind === 'rate' || kind === 'decimal') return Number.isInteger(n) ? String(n) : n.toFixed(1)
  return number(n)
}

function niceStep(raw, integer) {
  if (!(raw > 0)) return 1
  const exp = 10 ** Math.floor(Math.log10(raw))
  const f = raw / exp
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp
  return integer ? Math.max(1, Math.round(step)) : step
}

/** An axis from 0 with round ticks; `domain` widens it (feedback scores always run 0–5). */
function scaleFor(values, { integer = false, domain } = {}) {
  const nums = values.filter((v) => v != null)
  let hi = Math.max(0, ...nums)
  let lo = Math.min(0, ...nums)
  if (domain) {
    lo = Math.min(lo, domain[0])
    hi = Math.max(hi, domain[1])
  }
  const step = niceStep((hi - lo) / 4, integer)
  const top = hi > 0 ? Math.ceil(hi / step - 1e-9) * step : 0
  const bottom = lo < 0 ? Math.floor(lo / step + 1e-9) * step : 0
  if (!(top > bottom)) return { top: step, bottom: 0, ticks: [0, step] }
  const ticks = []
  for (let t = bottom; t <= top + step / 2; t += step) ticks.push(Number(t.toFixed(6)))
  return { top, bottom, ticks }
}

/** Runs of consecutive points with data, so a line breaks where a month has none. */
function segments(points) {
  const out = []
  let run = []
  points.forEach((value, index) => {
    if (value == null) {
      if (run.length) out.push(run)
      run = []
    } else run.push(index)
  })
  if (run.length) out.push(run)
  return out
}

/**
 * One small chart for the history grid (Peter's mockup, Nov 2026). Each series is a bar, line or
 * area; bars can stack; a series on the right axis gets its own scale (feedback responses next to
 * the score). Missing points are left blank, never drawn as zero.
 */
export function HistoryChart({ labels = [], titles = [], series = [], kind = 'count', rightKind = 'count', stacked = false, domain, title, note }) {
  const [hover, setHover] = useState(null)
  const n = labels.length
  if (!n || !series.length) return <p className="muted empty">No data yet.</p>

  const left = series.filter((s) => s.axis !== 'right')
  const right = series.filter((s) => s.axis === 'right')
  const bars = series.filter((s) => s.type === 'bar')
  const leftBars = left.filter((s) => s.type === 'bar')
  const leftValues = stacked
    ? labels.map((_, i) => leftBars.reduce((sum, s) => sum + (Number(s.points[i]) || 0), 0)).concat(left.filter((s) => s.type !== 'bar').flatMap((s) => s.points))
    : left.flatMap((s) => s.points)
  const scaleL = scaleFor(leftValues.map(num), { integer: kind === 'count', domain })
  const scaleR = right.length ? scaleFor(right.flatMap((s) => s.points).map(num), { integer: rightKind === 'count' }) : null
  const padR = scaleR ? RIGHT_PAD : PAD.r
  const innerW = W - PAD.l - padR
  const innerH = H - PAD.t - PAD.b
  const slot = innerW / n
  const yFor = (scale) => (value) => PAD.t + ((scale.top - value) / (scale.top - scale.bottom)) * innerH
  const yL = yFor(scaleL)
  const yR = scaleR ? yFor(scaleR) : yL
  const yOf = (s) => (s.axis === 'right' ? yR : yL)
  const kindOf = (s) => (s.axis === 'right' ? rightKind : kind)
  const groups = stacked ? 1 : Math.max(1, bars.length)
  const barW = Math.max(3, Math.min(stacked ? 22 : 16, (slot * 0.72) / groups))
  const xCenter = (i) => PAD.l + slot * (i + 0.5)
  // Twelve "Nov 1" labels don't fit under a small chart: show every other one, the last included.
  const every = n > 8 && Math.max(...labels.map((l) => String(l).length)) > 3 ? 2 : 1
  const fmt = (v) => v.toFixed(1)

  return (
    <div className="history-chart">
      <div className="hc-readout" aria-live="polite">
        {hover == null ? (
          ''
        ) : (
          <>
            <b>{titles[hover] || labels[hover]}</b>
            {series.map((s) => ` · ${s.label} ${s.points[hover] == null ? 'n/a' : formatValue(kindOf(s), s.points[hover])}`).join('')}
          </>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {scaleL.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - padR} y1={yL(t)} y2={yL(t)} className={t === 0 ? 'axis' : 'grid'} />
            <text x={PAD.l - 6} y={yL(t) + 3.5} textAnchor="end" className="tick">
              {compact(kind, t)}
            </text>
          </g>
        ))}
        {scaleR
          ? scaleR.ticks.map((t) => (
              <text key={t} x={W - padR + 6} y={yR(t) + 3.5} textAnchor="start" className="tick">
                {compact(rightKind, t)}
              </text>
            ))
          : null}
        {labels.map((_, i) => {
          let base = 0
          return bars.map((s, b) => {
            const value = num(s.points[i])
            if (value == null) return null
            const y = yOf(s)
            const x = stacked ? xCenter(i) - barW / 2 : xCenter(i) - (barW * groups) / 2 + barW * b
            let top
            let height
            if (stacked) {
              top = y(base + value)
              height = y(base) - top
              base += value
            } else {
              top = Math.min(y(value), y(0))
              height = Math.abs(y(value) - y(0))
            }
            return <rect key={s.key} x={x} y={top} width={Math.max(barW - 1, 1)} height={Math.max(height, value ? 1 : 0)} rx="1.5" fill={s.color} opacity={hover == null || hover === i ? 1 : 0.6} />
          })
        })}
        {series
          .filter((s) => s.type !== 'bar')
          .map((s) => {
            const y = yOf(s)
            const points = s.points.map(num)
            return segments(points).map((run) => {
              const coords = run.map((i) => [xCenter(i), y(points[i])])
              const path = coords.map(([x, yy]) => `${fmt(x)},${fmt(yy)}`).join(' ')
              const baseline = fmt(y(0))
              return (
                <g key={`${s.key}-${run[0]}`}>
                  {s.type === 'area' && coords.length > 1 ? <polygon points={`${path} ${fmt(coords[coords.length - 1][0])},${baseline} ${fmt(coords[0][0])},${baseline}`} fill={s.color} opacity="0.15" /> : null}
                  {coords.length > 1 ? <polyline points={path} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" strokeLinecap="round" /> : null}
                  {coords.map(([x, yy], k) => (
                    <circle key={run[k]} cx={x} cy={yy} r={hover === run[k] ? 3.5 : 2.2} fill={s.dashed ? 'white' : s.color} stroke={s.color} strokeWidth="1.5" />
                  ))}
                </g>
              )
            })
          })}
        {labels.map((label, i) =>
          (n - 1 - i) % every === 0 ? (
            <text key={i} x={xCenter(i)} y={H - 8} textAnchor="middle" className="tick">
              {label}
            </text>
          ) : null,
        )}
        {series.every((s) => s.points.every((p) => p == null)) ? (
          <text x={PAD.l + innerW / 2} y={PAD.t + innerH / 2} textAnchor="middle" className="tick">
            No data yet
          </text>
        ) : null}
        {labels.map((_, i) => (
          <rect key={i} x={PAD.l + slot * i} y={PAD.t} width={slot} height={innerH} fill={hover === i ? 'rgba(15, 23, 42, 0.05)' : 'transparent'} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
      <div className="hc-legend">
        {series.map((s) => (
          <span key={s.key}>
            <i className={s.type === 'bar' ? 'hc-sq' : s.dashed ? 'hc-ln hc-dash' : 'hc-ln'} style={s.dashed ? { color: s.color } : { background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      {note ? <p className="muted tiny-text">{note}</p> : null}
    </div>
  )
}
