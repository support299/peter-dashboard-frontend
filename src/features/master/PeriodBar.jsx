import { DIVISIONS } from './constants'
import { splitLabel } from './format'
import { usePeriod } from './periodState'

const KINDS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
  { key: 'last_3y', label: 'Last 3 years' },
  { key: 'last_5y', label: 'Last 5 years' },
  { key: 'lifetime', label: 'Lifetime' },
  { key: 'custom', label: 'Custom' },
]

const PRESETS = new Set(['last_3y', 'last_5y', 'lifetime'])

const COMPARE = [
  { key: 'both', label: 'Previous period + last year' },
  { key: 'previous', label: 'Previous period' },
  { key: 'last_year', label: 'Same period last year' },
  { key: 'none', label: 'No comparison' },
]

/** "November 2026 (Nov 1–5, 2026)": phones put the dates on a small second line. */
function PeriodLabel({ label }) {
  const { name, dates } = splitLabel(label || '…')
  return (
    <strong className="period-label">
      {name}
      {dates ? <small> ({dates})</small> : null}
    </strong>
  )
}

function localToday() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function PeriodBar({ info, hideDivision = false, actions = null }) {
  const { state, update } = usePeriod()
  const period = info?.period
  const nav = info?.navigation

  return (
    <section className="period-bar" aria-label="Reporting period">
      <div className="period-kinds" role="tablist">
        {KINDS.map((kind) => (
          <button
            key={kind.key}
            type="button"
            role="tab"
            aria-selected={state.kind === kind.key}
            className={state.kind === kind.key ? 'active' : ''}
            onClick={() => update({ kind: kind.key, anchor: '' })}
          >
            {kind.label}
          </button>
        ))}
      </div>

      {state.kind === 'custom' ? (
        <div className="period-custom">
          <input type="date" aria-label="From" value={state.from} onChange={(e) => update({ from: e.target.value })} />
          <span>to</span>
          <input type="date" aria-label="To" value={state.to} onChange={(e) => update({ to: e.target.value })} />
        </div>
      ) : PRESETS.has(state.kind) ? (
        <div className="period-stepper">
          <PeriodLabel label={period?.label} />
        </div>
      ) : (
        <div className="period-stepper">
          <button type="button" className="ghost period-step" disabled={!nav} onClick={() => update({ anchor: nav.previous.start })} aria-label="Previous period">
            ‹<span className="period-step-text"> Previous</span>
          </button>
          <PeriodLabel label={period?.label} />
          <button
            type="button"
            className="ghost period-step"
            disabled={!nav || nav.next.start > localToday()}
            onClick={() => update({ anchor: nav.next.start })}
            aria-label="Next period"
          >
            <span className="period-step-text">Next </span>›
          </button>
          {state.kind === 'day' || state.kind === 'week' ? (
            <input
              type="date"
              aria-label="Go to date"
              value={state.anchor || period?.start || ''}
              max={localToday()}
              onChange={(e) => e.target.value && update({ anchor: e.target.value })}
            />
          ) : null}
          {state.anchor ? (
            <button type="button" className="ghost tiny" onClick={() => update({ anchor: '' })}>
              Today
            </button>
          ) : null}
        </div>
      )}

      <label className="period-select">
        <span>Compare with</span>
        <select value={state.compare} onChange={(e) => update({ compare: e.target.value })}>
          {COMPARE.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {hideDivision ? null : (
      <label className="period-select">
        <span>Division</span>
        <select value={state.division} onChange={(e) => update({ division: e.target.value })}>
          {DIVISIONS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      )}
      {actions ? <div className="period-actions">{actions}</div> : null}
    </section>
  )
}
