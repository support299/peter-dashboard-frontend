import { useEffect, useState } from 'react'
import { number, queryString } from '../../lib'
import { STATUS_LABELS } from './constants'
import { formatValue, monthName, shortDate } from './format'
import { useFetch, usePeriod } from './periodState'
import { PlanEditor } from './PlanEditor'
import { ReasonEditor } from './ReasonEditor'

function Cell({ column, row }) {
  const value = row[column.key]
  if (column.kind === 'date') return shortDate(value)
  if (column.kind === 'month') return monthName(value)
  if (column.kind === 'status') return <span className={`status-pill s-${value}`}>{STATUS_LABELS[value] || value}</span>
  if (['currency', 'percent', 'count'].includes(column.kind)) return value == null ? '—' : formatValue(column.kind, value)
  return value || '—'
}

export function DrillModal({ request, onClose, onChanged }) {
  const { params } = usePeriod()
  const [editing, setEditing] = useState(null)
  const [version, setVersion] = useState(0)
  const url = `/api/insights/drill/${queryString({ ...params, metric: request.metric, category: request.category, of: request.of })}`
  const { data: fetched, error, loading } = useFetch(url, version)
  // Keep showing rows while a saved edit refreshes the list; hide them only when the list itself changes.
  const data = fetched && (!loading || fetched.metric === request.metric) ? fetched : null

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function changed() {
    setVersion((v) => v + 1)
    onChanged?.()
  }

  const columns = data?.columns || []
  return (
    <div className="drill-backdrop" role="presentation" onClick={onClose}>
      <section className="drill-panel" role="dialog" aria-modal="true" aria-label={data?.title || request.title} onClick={(e) => e.stopPropagation()}>
        <header className="drill-head">
          <div>
            <p className="hero-kicker">{data?.period?.label || 'Details'}</p>
            <h3>{data?.title || request.title}</h3>
            {data ? (
              <p className="muted">
                {data.total_rows > data.rows.length
                  ? `Showing ${number(data.rows.length)} of ${number(data.total_rows)}`
                  : `${number(data.total_rows)} record${data.total_rows === 1 ? '' : 's'}`}
                {data.total != null ? ` · Total ${formatValue('currency', data.total)}` : ''}
              </p>
            ) : null}
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </header>
        {error ? <div className="notice">{error}</div> : null}
        {!data && !error ? <p className="muted drill-loading">Loading…</p> : null}
        {data?.note ? <p className="muted">{data.note}</p> : null}
        {data && data.rows.length === 0 && !data.note ? <p className="muted drill-loading">Nothing in this period.</p> : null}
        {data && data.rows.length ? (
          <div className="drill-table-wrap">
            <table className="drill-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className={`k-${column.kind}`}>
                      {column.label}
                    </th>
                  ))}
                  {data.editable ? <th aria-label="Actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={`${row.id ?? row.client_id ?? 'row'}-${row.month ?? ''}-${index}`}>
                    {columns.map((column) =>
                      data.editable === 'cancellations' && column.key === 'reason_label' ? (
                        <td key={column.key} colSpan={2}>
                          <ReasonEditor record={row} onSaved={changed} />
                        </td>
                      ) : data.editable === 'cancellations' && column.key === 'reason_notes' ? null : (
                        <td key={column.key} className={`k-${column.kind}`}>
                          {column.key === 'client' && row.link ? (
                            <a href={row.link} target="_blank" rel="noreferrer">
                              <Cell column={column} row={row} />
                            </a>
                          ) : (
                            <Cell column={column} row={row} />
                          )}
                        </td>
                      ),
                    )}
                    {data.editable === 'plans' ? (
                      <td>
                        <button type="button" className="ghost tiny" onClick={() => setEditing(row)}>
                          Edit
                        </button>
                      </td>
                    ) : data.editable ? (
                      <td />
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      {editing ? (
        <PlanEditor
          plan={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            changed()
          }}
        />
      ) : null}
    </div>
  )
}
