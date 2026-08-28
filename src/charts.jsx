import { useState } from 'react'
import { createPortal } from 'react-dom'
import { monthLabel, money, number } from './lib'

function asList(items) {
  return Array.isArray(items) ? items : []
}

function maxValue(items) {
  const list = asList(items)
  if (!list.length) return 1
  return Math.max(1, ...list.map((item) => Number(item.value || 0)))
}

function tipFromEvent(event, payload) {
  return {
    ...payload,
    x: event.clientX + 14,
    y: event.clientY + 14,
  }
}

function ChartTooltip({ tip }) {
  if (!tip) return null
  return createPortal(
    <div className="chart-tooltip follow" style={{ left: tip.x, top: tip.y }} role="tooltip">
      <strong>{tip.title}</strong>
      {tip.lines?.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>,
    document.body,
  )
}

export function AreaChart({ data, color = '#0f766e', onSelect, valueLabel = 'Value', animate = true }) {
  const rows = asList(data)
  const width = 640
  const height = 220
  const pad = { l: 12, r: 12, t: 16, b: 32 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const max = maxValue(rows)
  const [tip, setTip] = useState(null)

  if (!rows.length) {
    return <p className="empty muted">No chart data yet.</p>
  }

  const points = rows.map((item, index) => {
    const x = pad.l + (rows.length <= 1 ? innerW / 2 : (index / (rows.length - 1)) * innerW)
    const y = pad.t + innerH - (Number(item.value || 0) / max) * innerH
    return { ...item, x, y }
  })
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${points.at(-1)?.x || pad.l},${pad.t + innerH} L${points[0]?.x || pad.l},${pad.t + innerH} Z`
  const fillId = `areaFill-${color.replace('#', '')}`

  return (
    <div className={`chart-shell${animate ? ' area-animate' : ''}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {points.length > 1 ? <path className="area-fill-path" d={area} fill={`url(#${fillId})`} /> : null}
        {points.length > 1 ? (
          <path className="area-line-path" d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        ) : null}
        {points.map((point, index) => {
          const payload = {
            title: point.month ? monthLabel(point.month) : point.label || valueLabel,
            lines: [
              `${valueLabel}: ${typeof point.value === 'number' && valueLabel.toLowerCase().includes('revenue') ? money(point.value) : number(point.value)}`,
              point.count != null ? `Count: ${number(point.count)}` : null,
            ].filter(Boolean),
          }
          return (
            <g
              key={point.month || point.label || point.x}
              className="chart-point"
              style={{ '--i': index }}
              onClick={() => onSelect?.(point)}
              onMouseEnter={(event) => setTip(tipFromEvent(event, payload))}
              onMouseMove={(event) => setTip(tipFromEvent(event, payload))}
              onMouseLeave={() => setTip(null)}
            >
              <circle cx={point.x} cy={point.y} r="14" fill="transparent" />
              <circle className="area-dot" cx={point.x} cy={point.y} r="4" fill={color} />
              <text x={point.x} y={height - 8} textAnchor="middle">
                {point.month ? monthLabel(point.month) : point.label || ''}
              </text>
            </g>
          )
        })}
      </svg>
      <ChartTooltip tip={tip} />
    </div>
  )
}

export function Bars({ data, color = '#0f766e', onSelect, valueLabel = 'Count' }) {
  const rows = asList(data)
  const [tip, setTip] = useState(null)
  if (!rows.length) {
    return <p className="empty muted">No chart data yet.</p>
  }
  const max = maxValue(rows)

  function payloadFor(item) {
    return {
      title: item.label,
      lines: [
        `${valueLabel}: ${valueLabel.toLowerCase().includes('revenue') ? money(item.value) : number(item.value)}`,
        item.revenue != null && valueLabel !== 'Revenue' ? `Revenue: ${money(item.revenue)}` : null,
        item.count != null && valueLabel !== 'Count' ? `Count: ${number(item.count)}` : null,
      ].filter(Boolean),
    }
  }

  return (
    <div className="chart-shell">
      <div className="bars">
        {rows.map((item) => (
          <button
            type="button"
            key={item.label || item.key}
            className="bar-row"
            onClick={() => onSelect?.(item)}
            onMouseEnter={(event) => setTip(tipFromEvent(event, payloadFor(item)))}
            onMouseMove={(event) => setTip(tipFromEvent(event, payloadFor(item)))}
            onMouseLeave={() => setTip(null)}
          >
            <span>{item.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(Number(item.value || 0) / max) * 100}%`, background: color }} />
            </div>
            <strong>{valueLabel.toLowerCase().includes('revenue') ? money(item.value) : number(item.value)}</strong>
          </button>
        ))}
      </div>
      <ChartTooltip tip={tip} />
    </div>
  )
}

export function Donut({ data, onSelect }) {
  const rows = asList(data)
  const [tip, setTip] = useState(null)
  if (!rows.length) {
    return <p className="empty muted">No chart data yet.</p>
  }
  const total = rows.reduce((sum, item) => sum + Number(item.count || item.value || 0), 0) || 1
  const colors = ['#0f766e', '#2563eb', '#d97706', '#db2777', '#64748b', '#7c3aed']
  let angle = 0
  const slices = rows.map((item, index) => {
    const value = Number(item.count || item.value || 0)
    const sweep = (value / total) * 360
    const start = angle
    angle += sweep
    return { ...item, start, sweep, color: colors[index % colors.length] }
  })

  function payloadFor(slice) {
    return {
      title: slice.label,
      lines: [
        `Count: ${number(slice.count || slice.value)}`,
        slice.revenue != null ? `Revenue: ${money(slice.revenue)}` : null,
        `${Math.round(((slice.count || slice.value || 0) / total) * 100)}%`,
      ].filter(Boolean),
    }
  }

  return (
    <div className="chart-shell">
      <div className="donut-wrap">
        <svg viewBox="0 0 160 160" className="donut">
          {slices.map((slice) => (
            <circle
              key={slice.label || slice.key}
              r="52"
              cx="80"
              cy="80"
              fill="transparent"
              stroke={slice.color}
              strokeWidth="22"
              strokeDasharray={`${(slice.sweep / 360) * 327} 327`}
              strokeDashoffset={-((slice.start / 360) * 327)}
              transform="rotate(-90 80 80)"
              onClick={() => onSelect?.(slice)}
              onMouseEnter={(event) => setTip(tipFromEvent(event, payloadFor(slice)))}
              onMouseMove={(event) => setTip(tipFromEvent(event, payloadFor(slice)))}
              onMouseLeave={() => setTip(null)}
            />
          ))}
        </svg>
        <ul>
          {slices.map((slice) => (
            <li key={slice.label || slice.key}>
              <button
                type="button"
                onClick={() => onSelect?.(slice)}
                onMouseEnter={(event) => setTip(tipFromEvent(event, payloadFor(slice)))}
                onMouseMove={(event) => setTip(tipFromEvent(event, payloadFor(slice)))}
                onMouseLeave={() => setTip(null)}
              >
                <i style={{ background: slice.color }} />
                <span>{slice.label}</span>
                <strong>{number(slice.count || slice.value)}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ChartTooltip tip={tip} />
    </div>
  )
}

export const PRICING_COLORS = ['#0891b2', '#0e7490', '#155e75', '#f43f5e', '#fb7185', '#64748b']
export const INTERNAL_COLORS = ['#0f766e', '#14b8a6', '#2563eb', '#f59e0b', '#e11d48', '#64748b']
export const JOBBER_COLORS = ['#0f766e', '#2563eb', '#d97706', '#64748b', '#e11d48', '#0ea5e9']

function wrapLabel(label, maxChars) {
  const text = String(label || '')
  if (!text || text.length <= maxChars) return [text]
  const words = text.split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

export function ColumnChart({ data, color = '#0891b2', onSelect, valueLabel = 'Value' }) {
  const rows = asList(data)
  const [tip, setTip] = useState(null)
  if (!rows.length) return <p className="empty muted">No chart data yet.</p>

  const width = 640
  const height = 250
  const pad = { l: 28, r: 12, t: 18, b: 52 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const max = maxValue(rows)
  const gap = 14
  const barW = Math.max(18, (innerW - gap * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1))
  const maxChars = Math.max(8, Math.floor(barW / 7.5))

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart column-chart" role="img">
        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = pad.t + innerH - step * innerH
          return <line key={step} x1={pad.l} x2={width - pad.r} y1={y} y2={y} className="chart-grid" />
        })}
        {rows.map((item, index) => {
          const value = Number(item.value || 0)
          const h = (value / max) * innerH
          const x = pad.l + index * (barW + gap)
          const y = pad.t + innerH - h
          const label = item.month ? monthLabel(item.month) : item.label || ''
          const lines = item.month ? [label] : wrapLabel(label, maxChars)
          const payload = {
            title: item.month ? monthLabel(item.month) : item.label || valueLabel,
            lines: [
              `${valueLabel}: ${valueLabel.toLowerCase().includes('revenue') ? money(value) : number(value)}`,
              item.count != null ? `Quotes: ${number(item.count)}` : null,
            ].filter(Boolean),
          }
          return (
            <g
              key={item.month || item.label || index}
              className="column-bar"
              onClick={() => onSelect?.(item)}
              onMouseEnter={(event) => setTip(tipFromEvent(event, payload))}
              onMouseMove={(event) => setTip(tipFromEvent(event, payload))}
              onMouseLeave={() => setTip(null)}
            >
              <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx="8" fill={color} opacity="0.92" />
              <text x={x + barW / 2} y={height - pad.b + 16} textAnchor="middle" className="column-label">
                {lines.map((line, lineIndex) => (
                  <tspan key={`${line}-${lineIndex}`} x={x + barW / 2} dy={lineIndex === 0 ? 0 : 13}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
      <ChartTooltip tip={tip} />
    </div>
  )
}

export function SegmentedBar({ data, onSelect, colors = PRICING_COLORS }) {
  const rows = asList(data)
  const [tip, setTip] = useState(null)
  if (!rows.length) return <p className="empty muted">No chart data yet.</p>
  const total = rows.reduce((sum, item) => sum + Number(item.count || item.value || 0), 0) || 1
  const palette = asList(colors).length ? colors : PRICING_COLORS

  function payloadFor(item, value, pct) {
    return {
      title: item.label,
      lines: [
        `Count: ${number(value)}`,
        `${Math.round(pct)}%`,
        item.revenue != null ? `Revenue: ${money(item.revenue)}` : null,
        item.amount != null ? `Amount: ${money(item.amount)}` : null,
      ].filter(Boolean),
    }
  }

  return (
    <div className="chart-shell">
      <div className="segmented-bar">
        <div className="segmented-track">
          {rows.map((item, index) => {
            const value = Number(item.count || item.value || 0)
            const pct = (value / total) * 100
            return (
              <button
                type="button"
                key={item.label || item.key || index}
                className="segment"
                style={{ width: `${Math.max(pct, 1.5)}%`, background: palette[index % palette.length] }}
                onClick={() => onSelect?.(item)}
                onMouseEnter={(event) => setTip(tipFromEvent(event, payloadFor(item, value, pct)))}
                onMouseMove={(event) => setTip(tipFromEvent(event, payloadFor(item, value, pct)))}
                onMouseLeave={() => setTip(null)}
              />
            )
          })}
        </div>
        <ul className="segmented-legend">
          {rows.map((item, index) => {
            const value = Number(item.count || item.value || 0)
            const pct = (value / total) * 100
            return (
              <li key={item.label || item.key || index}>
                <button
                  type="button"
                  onClick={() => onSelect?.(item)}
                  onMouseEnter={(event) => setTip(tipFromEvent(event, payloadFor(item, value, pct)))}
                  onMouseMove={(event) => setTip(tipFromEvent(event, payloadFor(item, value, pct)))}
                  onMouseLeave={() => setTip(null)}
                >
                  <i style={{ background: palette[index % palette.length] }} />
                  <span>{item.label}</span>
                  <strong>{number(item.count || item.value)}</strong>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <ChartTooltip tip={tip} />
    </div>
  )
}

export function RankBars({ data, onSelect, valueLabel = 'Revenue' }) {
  const rows = asList(data)
  const [tip, setTip] = useState(null)
  if (!rows.length) return <p className="empty muted">No chart data yet.</p>
  const max = maxValue(rows)

  function payloadFor(item) {
    return {
      title: item.label,
      lines: [
        `${valueLabel}: ${valueLabel.toLowerCase().includes('revenue') ? money(item.value) : number(item.value)}`,
        item.count != null ? `Quotes: ${number(item.count)}` : null,
      ].filter(Boolean),
    }
  }

  return (
    <div className="chart-shell">
      <div className="rank-bars">
        {rows.map((item, index) => (
          <button
            type="button"
            key={item.label || item.key || index}
            className="rank-row"
            onClick={() => onSelect?.(item)}
            onMouseEnter={(event) => setTip(tipFromEvent(event, payloadFor(item)))}
            onMouseMove={(event) => setTip(tipFromEvent(event, payloadFor(item)))}
            onMouseLeave={() => setTip(null)}
          >
            <span className="rank-index">{index + 1}</span>
            <div className="rank-body">
              <div className="rank-meta">
                <span>{item.label}</span>
                <strong>{valueLabel.toLowerCase().includes('revenue') ? money(item.value) : number(item.value)}</strong>
              </div>
              <div className="rank-track">
                <div className="rank-fill" style={{ width: `${(Number(item.value || 0) / max) * 100}%` }} />
              </div>
            </div>
          </button>
        ))}
      </div>
      <ChartTooltip tip={tip} />
    </div>
  )
}
