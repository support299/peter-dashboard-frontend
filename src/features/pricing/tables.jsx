import { money, when } from '../../lib'

export function PricingSubmissionTable({ rows, onOpen, compact = false }) {
  return (
    <table className={`table ${compact ? 'table-compact' : ''}`}>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Status</th>
          {!compact ? <th>Property</th> : null}
          {!compact ? <th>Location</th> : null}
          {!compact ? <th>Source</th> : null}
          <th>Total</th>
          {!compact ? <th>Created</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <button type="button" onClick={() => onOpen?.(row.id)}>
                {row.customer}
              </button>
              <div className="hint">{row.email || row.phone || '—'}</div>
            </td>
            <td>
              <span className="chip">{row.status}</span>
            </td>
            {!compact ? <td>{row.property_type}</td> : null}
            {!compact ? <td>{row.location}</td> : null}
            {!compact ? <td>{row.lead_source || '—'}</td> : null}
            <td>{money(row.final_total)}</td>
            {!compact ? <td>{when(row.created_at)}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function SimplePricingTable({ rows, columns }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={col.key}>{col.render ? col.render(row) : row[col.key] ?? '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
