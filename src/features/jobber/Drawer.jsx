import { money, when } from '../../lib'
import { Field } from '../dashboard/Field'

export function Drawer({ payload, onBack, onOpen }) {
  const item = payload.item || {}
  return (
    <div className="drawer-backdrop" onClick={onBack} role="presentation">
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <button className="back" type="button" onClick={onBack}>
          ← Back
        </button>
        <h2>{item.title || item.name || item.number}</h2>
        <div className="details">
          <Field label="Status">{item.status}</Field>
          <Field label="Customer">
            {item.client_id ? (
              <button type="button" onClick={() => onOpen('clients', item.client_id)}>
                {item.client}
              </button>
            ) : (
              item.client
            )}
          </Field>
          <Field label="When">{when(item.start_at || item.issued_at, Boolean(item.start_at))}</Field>
          <Field label="Type">{item.kind}</Field>
          <Field label="Address">{item.address}</Field>
          <Field label="Team">{item.team?.join(', ')}</Field>
          <Field label="Phone">{item.phone}</Field>
          <Field label="Email">{item.email}</Field>
          <Field label={item.subtotal != null || item.gross_total != null ? 'Subtotal (ex tax)' : 'Total'}>
            {item.total != null ? money(item.total) : item.amount != null ? money(item.amount) : null}
          </Field>
          <Field label="Tax">{item.tax != null ? money(item.tax) : null}</Field>
          <Field label="Gross (inc tax)">{item.gross_total != null ? money(item.gross_total) : null}</Field>
          <Field label="Balance">{item.balance != null ? money(item.balance) : null}</Field>
          <Field label="Paid">{item.paid != null ? money(item.paid) : null}</Field>
          <Field label="Notes">{item.instructions || item.subject}</Field>
        </div>
        {item.line_items?.length ? (
          <div className="stack">
            <p className="hint">Line items</p>
            {item.line_items.map((line, index) => (
              <div className="line" key={`${line.name}-${index}`}>
                {line.name} · {money(line.total)}
              </div>
            ))}
          </div>
        ) : null}
        {item.visits?.length ? (
          <div className="stack" style={{ marginTop: 16 }}>
            <p className="hint">Visits</p>
            {item.visits.map((visit) => (
              <button key={visit.id} type="button" onClick={() => onOpen('visits', visit.id)}>
                {visit.title} · {when(visit.start_at)}
              </button>
            ))}
          </div>
        ) : null}
        {item.jobs?.length ? (
          <div className="stack" style={{ marginTop: 16 }}>
            <p className="hint">Jobs</p>
            {item.jobs.map((job) => (
              <button key={job.id} type="button" onClick={() => onOpen('jobs', job.id)}>
                {job.title}
              </button>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  )
}
