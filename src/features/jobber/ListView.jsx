import { customerLabel, money, number, when } from '../../lib'
import { JobberFilterBar } from './JobberFilterBar'
import { VisitTable } from './VisitTable'

export function ListView({ view, list, search, setSearch, filters, setFilter, patchFilters, filterOptions, onPage, onOpen }) {
  return (
    <article className="card list-card">
      <JobberFilterBar
        view={view}
        filters={filters || {}}
        setFilter={setFilter}
        patchFilters={patchFilters}
        filterOptions={filterOptions}
        search={search}
        setSearch={setSearch}
      />
      {!list ? <p className="empty muted">Loading…</p> : null}
      {list && !list.results.length ? <p className="empty muted">Nothing here yet.</p> : null}
      {view === 'visits' && list ? <VisitTable rows={list.results} onOpen={(id) => onOpen('visits', id)} /> : null}
      {view === 'jobs' && list ? (
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Type</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {list.results.map((job) => (
              <tr key={job.id}>
                <td>
                  <button type="button" onClick={() => onOpen('jobs', job.id)}>
                    {job.title}
                  </button>
                </td>
                <td>{job.client || '—'}</td>
                <td>
                  <span className="chip">{job.status}</span>
                </td>
                <td>{job.kind}</td>
                <td>{money(job.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {view === 'clients' && list ? (
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Jobs</th>
              <th>Visits</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {list.results.map((client) => (
              <tr key={client.id}>
                <td>
                  <button type="button" onClick={() => onOpen('clients', client.id)}>
                    {customerLabel(client)}
                  </button>
                  {client.lead ? <div className="hint">Lead</div> : null}
                </td>
                <td>{client.email || client.phone || '—'}</td>
                <td>{number(client.jobs)}</td>
                <td>{number(client.visits)}</td>
                <td>{money(client.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {view === 'invoices' && list ? (
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Issued</th>
              <th>Status</th>
              <th>Total</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {list.results.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <button type="button" onClick={() => onOpen('invoices', invoice.id)}>
                    {invoice.number}
                  </button>
                </td>
                <td>{invoice.client || '—'}</td>
                <td>{when(invoice.issued_at)}</td>
                <td>
                  <span className="chip">{invoice.status}</span>
                </td>
                <td>{money(invoice.total)}</td>
                <td>{money(invoice.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {list?.pages > 1 ? (
        <div className="pager">
          <button type="button" disabled={list.page <= 1} onClick={() => onPage(list.page - 1)}>
            Previous
          </button>
          <span className="hint">
            Page {list.page} of {list.pages}
          </span>
          <button type="button" disabled={list.page >= list.pages} onClick={() => onPage(list.page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </article>
  )
}
