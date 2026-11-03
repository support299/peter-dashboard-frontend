import { useEffect } from 'react'
import { DrillModal } from '../master/DrillModal'
import { PeriodBar } from '../master/PeriodBar'
import { useComparisons, usePeriod } from '../master/periodState'
import '../master/master.css'
import './finance.css'

/** Period bar, comparison note, loading/error and the drill-down modal for a Financials page. */
export function FinanceShell({ data, error, drill, onCloseDrill, actions, children, compareNote = true }) {
  const { reload } = usePeriod()
  const comparisons = useComparisons(data)
  return (
    <div className="master finance">
      <PeriodBar info={data} hideDivision actions={actions} />
      {error ? <div className="notice">{error}</div> : null}
      {compareNote && data && comparisons.length ? (
        <p className="period-note muted">
          Comparing with{' '}
          {comparisons.map(({ name, label }, index) => (
            <span key={name}>
              {index ? ' and ' : ''}
              <b>{name === 'previous' ? 'prev. period' : 'last year'}</b> ({label})
            </span>
          ))}
          .
        </p>
      ) : null}
      {!data && !error ? <p className="muted">Loading…</p> : null}
      {data ? children : null}
      {drill ? <DrillModal request={drill} onClose={onCloseDrill} onChanged={reload} /> : null}
    </div>
  )
}

/** Centered dialog (full screen on phones). */
export function Modal({ title, kicker, onClose, children, wide = false, onSubmit }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const Tag = onSubmit ? 'form' : 'section'
  return (
    <div className="drill-backdrop nested" role="presentation" onMouseDown={onClose}>
      <Tag
        className={`fin-modal${wide ? ' wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        noValidate
      >
        <header className="fin-modal-head">
          <div>
            {kicker ? <p className="hero-kicker">{kicker}</p> : null}
            <h3>{title}</h3>
          </div>
          <button type="button" className="ghost tiny" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        {children}
      </Tag>
    </div>
  )
}

export function Field({ label, hint, children, wide = false }) {
  return (
    <label className={`fin-field${wide ? ' wide' : ''}`}>
      <span>{label}</span>
      {children}
      {hint ? <small className="muted">{hint}</small> : null}
    </label>
  )
}

/** Category select grouped by COGS / Operating / Vehicles / Other. */
export function CategorySelect({ meta, value, onChange, placeholder = 'Choose a category', allowEmpty = false, includeInactive = false }) {
  const cats = (meta?.categories || []).filter((c) => !c.parent_id && (includeInactive || c.is_active))
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}>
      <option value="" disabled={!allowEmpty}>
        {placeholder}
      </option>
      {(meta?.groups || []).map((group) => (
        <optgroup key={group.key} label={group.label}>
          {cats
            .filter((c) => c.group === group.key)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}

export function Choice({ options = [], value, onChange, empty }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {empty !== undefined ? <option value="">{empty}</option> : null}
      {options.map((item) => (
        <option key={item.key} value={item.key}>
          {item.label}
        </option>
      ))}
    </select>
  )
}

/** "Take a photo or choose a file" — opens the camera on phones. */
export function ReceiptInput({ file, onChange, current, onView, onRemove, disabled }) {
  return (
    <div className="fin-receipt">
      {current && !file ? (
        <div className="fin-receipt-current">
          <span>📎 {current}</span>
          <button type="button" className="ghost tiny" onClick={onView}>
            View
          </button>
          {onRemove ? (
            <button type="button" className="ghost tiny" onClick={onRemove}>
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
      <label className={`fin-file${disabled ? ' disabled' : ''}`}>
        <input type="file" accept="image/*,application/pdf,.heic,.heif" disabled={disabled} onChange={(e) => onChange(e.target.files?.[0] || null)} />
        <span>{file ? `📎 ${file.name}` : current ? 'Replace receipt (photo or PDF)' : 'Attach receipt — take a photo or choose a PDF'}</span>
      </label>
      {file ? (
        <button type="button" className="ghost tiny" onClick={() => onChange(null)}>
          Don’t attach
        </button>
      ) : null}
      {disabled ? <small className="muted">Receipt storage isn’t set up on the server yet.</small> : null}
    </div>
  )
}

export function Pager({ data, page, setPage, noun = 'records' }) {
  if (!data || data.pages <= 1) return null
  return (
    <div className="pager">
      <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
        ‹
      </button>
      <span>
        Page {data.page} of {data.pages} · {data.count} {noun}
      </span>
      <button type="button" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
        ›
      </button>
    </div>
  )
}
