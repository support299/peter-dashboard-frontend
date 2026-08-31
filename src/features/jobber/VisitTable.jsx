import { money, when } from '../../lib'

export function VisitTable({ rows, onOpen }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Visit</th>
          <th>Customer</th>
          <th>When</th>
          <th>Status</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((visit) => (
          <tr key={visit.id}>
            <td>
              <button type="button" onClick={() => onOpen(visit.id)}>
                {visit.title}
              </button>
            </td>
            <td>{visit.client || '—'}</td>
            <td>{when(visit.start_at, true)}</td>
            <td>
              <span className={`chip ${visit.status === 'Completed' ? 'good' : ''}`}>{visit.status}</span>
            </td>
            <td>{money(visit.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
