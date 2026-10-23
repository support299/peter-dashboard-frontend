import { DIVISIONS } from './constants'
import { usePeriod } from './periodState'

const KINDS = [
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
]

const COMPARE = [
  { key: 'both', label: 'Previous period + last year' },
  { key: 'previous', label: 'Previous period' },
  { key: 'last_year', label: 'Same period last year' },
  { key: 'none', label: 'No comparison' },
]

function localToday() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function PeriodBar({ info }) {
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
      ) : (
        <div className="period-stepper">
          <button type="button" className="ghost" disabled={!nav} onClick={() => update({ anchor: nav.previous.start })} aria-label="Previous period">
            ‹ Previous
          </button>
          <strong>{period?.label || '…'}</strong>
          <button
            type="button"
            className="ghost"
            disabled={!nav || nav.next.start > localToday()}
            onClick={() => update({ anchor: nav.next.start })}
            aria-label="Next period"
          >
            Next ›
          </button>
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
    </section>
  )
}
