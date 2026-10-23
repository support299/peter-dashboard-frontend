import { formatChange, formatValue, tone } from './format'

const SHORT_NAMES = { previous: 'Prev. period', last_year: 'Last year' }

/** "▲ 3.4%" for amounts and counts, "▼ 8.1 pts" for percentages. */
function deltaText(kind, current, other) {
  const diff = Number(current) - Number(other)
  if (!diff) return { diff, text: '0%' }
  const arrow = diff > 0 ? '▲' : '▼'
  if (kind === 'percent') return { diff, text: `${arrow} ${Math.abs(diff).toFixed(1)} pts` }
  const base = Number(other)
  if (!base) return { diff, text: `${arrow} new` }
  return { diff, text: `${arrow} ${Math.abs((diff / Math.abs(base)) * 100).toFixed(1)}%` }
}

function CompareRow({ kpi, name, label }) {
  const other = kpi[name]
  if (other === undefined) return null
  const title = `vs ${label}`
  if (other === null) {
    return (
      <div className="kpi-row" title={`${title}: no data for that period`}>
        <span className="kpi-row-name">{SHORT_NAMES[name] || label}</span>
        <span className="kpi-row-value">—</span>
        <span className="kpi-delta flat">n/a</span>
      </div>
    )
  }
  const delta = deltaText(kpi.kind, kpi.current, other)
  const exact = formatChange(kpi.kind, kpi.current, other)
  return (
    <div className="kpi-row" title={`${title}${exact ? `: ${exact.text}` : ''}`}>
      <span className="kpi-row-name">{SHORT_NAMES[name] || label}</span>
      <span className="kpi-row-value">{formatValue(kpi.kind, other)}</span>
      <span className={`kpi-delta ${tone(kpi.better, delta.diff)}`}>{delta.text}</span>
    </div>
  )
}

/** ⓘ with a "How it's calculated" bubble on hover. */
export function HowInfo({ text }) {
  if (!text) return null
  return (
    <span className="kpi-info" aria-label={`How it's calculated: ${text}`}>
      i<span className="kpi-info-bubble" role="tooltip">
        <b>How it's calculated</b>
        {text}
      </span>
    </span>
  )
}

export function KpiCard({ kpi, comparisons = [], onDrill, size = 'md' }) {
  const clickable = Boolean(kpi.drill && kpi.available && onDrill)
  const Tag = clickable ? 'button' : 'article'
  const rows = kpi.available ? comparisons.filter(({ name }) => kpi[name] !== undefined) : []
  return (
    <Tag
      type={clickable ? 'button' : undefined}
      className={`kpi-card size-${size}${kpi.available ? '' : ' unavailable'}${clickable ? ' clickable' : ''}`}
      onClick={clickable ? () => onDrill(kpi.drill, kpi.label) : undefined}
      title={clickable ? 'Click to see the records behind this number' : undefined}
    >
      <span className="kpi-label">
        {kpi.label}
        <HowInfo text={kpi.how} />
      </span>
      {kpi.available ? (
        <strong className="kpi-value">{formatValue(kpi.kind, kpi.current)}</strong>
      ) : (
        <strong className="kpi-value muted">—</strong>
      )}
      {rows.length ? (
        <div className="kpi-rows">
          {rows.map(({ name, label }) => (
            <CompareRow key={name} kpi={kpi} name={name} label={label} />
          ))}
        </div>
      ) : null}
      {kpi.note ? <span className="kpi-note">{kpi.note}</span> : null}
      {kpi.point_in_time && kpi.available && !rows.length ? <span className="kpi-note">At end of period</span> : null}
    </Tag>
  )
}

/** Cards for the numbers we have; numbers still waiting for data collapse into one row of chips. */
export function KpiGrid({ kpis = [], comparisons, onDrill, size, columns }) {
  const ready = kpis.filter((kpi) => kpi.available)
  const pending = kpis.filter((kpi) => !kpi.available)
  return (
    <>
      {ready.length ? (
        <div className="kpi-grid" style={columns ? { '--kpi-cols': columns } : undefined}>
          {ready.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} comparisons={comparisons} onDrill={onDrill} size={size} />
          ))}
        </div>
      ) : null}
      {pending.length ? <PendingKpis kpis={pending} /> : null}
    </>
  )
}

function PendingKpis({ kpis }) {
  // Group by reason so the explanation is written once, not on every chip.
  const groups = kpis.reduce((acc, kpi) => {
    const note = kpi.note || 'No data for this period.'
    ;(acc[note] = acc[note] || []).push(kpi)
    return acc
  }, {})
  return (
    <div className="kpi-pending">
      {Object.entries(groups).map(([note, items]) => (
        <div key={note} className="kpi-pending-group">
          <span className="kpi-pending-title">Not available yet</span>
          <div className="kpi-chips">
            {items.map((kpi) => (
              <span key={kpi.key} className="kpi-chip" title={kpi.how || note}>
                {kpi.label}
              </span>
            ))}
          </div>
          <span className="kpi-pending-note">{note}</span>
        </div>
      ))}
    </div>
  )
}
