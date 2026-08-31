import { money, number, when } from '../../lib'

export function EmployeeTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Position</th>
          <th>Status</th>
          <th>Absences</th>
          <th>Late</th>
          <th>Vacation</th>
          <th>Attendance</th>
          <th>Bonus</th>
          <th>Visits</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <div>{row.name}</div>
              <div className="hint">{row.email || row.phone || '—'}</div>
            </td>
            <td>{row.role}</td>
            <td>{row.position}</td>
            <td>
              <span className={`chip ${row.status === 'active' ? 'good' : ''}`}>{row.status}</span>
            </td>
            <td>{number(row.absences)}</td>
            <td>{number(row.late_arrivals)}</td>
            <td>{number(row.vacations ?? row.available_vacation_days)}</td>
            <td>{row.attendance_days != null ? number(row.attendance_days) : '—'}</td>
            <td>{money(row.bonus_amount)}</td>
            <td>{number(row.visits)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LeaveTable({ rows, compact = false }) {
  return (
    <table className={`table ${compact ? 'table-compact' : ''}`}>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Type</th>
          {!compact ? <th>Dates</th> : null}
          <th>Status</th>
          {!compact ? <th>Days</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <div>{row.employee || '—'}</div>
              {compact ? <div className="hint">{when(row.start_date)}</div> : null}
            </td>
            <td>{row.leave_type}</td>
            {!compact ? (
              <td>
                {when(row.start_date)} → {when(row.end_date)}
              </td>
            ) : null}
            <td>
              <span className={`chip ${row.status === 'approved' ? 'good' : row.status === 'rejected' ? 'bad' : ''}`}>
                {row.status}
              </span>
            </td>
            {!compact ? <td>{row.weekday_count ?? '—'}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function BonusTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Employee</th>
          <th>Type</th>
          <th>Client</th>
          <th>Status</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.employee || '—'}</td>
            <td>{row.bonus_type}</td>
            <td>{row.client || '—'}</td>
            <td>
              <span className={`chip ${row.paid ? 'good' : ''}`}>{row.status}</span>
            </td>
            <td>{money(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LockInTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Client</th>
          <th>Quote</th>
          <th>Status</th>
          <th>Frequency</th>
          <th>Team</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.client || '—'}</td>
            <td>{row.quote_id || '—'}</td>
            <td>
              <span className={`chip ${row.locked_in ? 'good' : ''}`}>{row.status}</span>
            </td>
            <td>{row.frequency || '—'}</td>
            <td>{row.team?.join(', ') || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function HubVisitTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Visit</th>
          <th>Client</th>
          <th>When</th>
          <th>Type</th>
          <th>Team</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.title}</td>
            <td>{row.client || '—'}</td>
            <td>{when(row.start_at, true)}</td>
            <td>{row.job_type || '—'}</td>
            <td>{row.team?.join(', ') || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
