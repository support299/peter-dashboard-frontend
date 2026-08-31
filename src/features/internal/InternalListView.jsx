import { number } from '../../lib'
import { FilterBar } from '../dashboard/FilterBar'
import { BonusTable, EmployeeTable, HubVisitTable, LeaveTable, LockInTable } from './tables'

export function InternalListView({ view, list, search, setSearch, filters, setFilter, filterOptions, onPage }) {
  return (
    <article className="panel list-panel internal-list anim-rise" style={{ '--delay': '80ms' }}>
      <header className="panel-head">
        <div>
          <h3>{view.charAt(0).toUpperCase() + view.slice(1)}</h3>
          <p>Filter and search stored hub records</p>
        </div>
        <span className="meta-pill">{number(list?.count || 0)} total</span>
      </header>
      <FilterBar
        view={view}
        filters={filters}
        setFilter={setFilter}
        filterOptions={filterOptions}
        search={search}
        setSearch={setSearch}
      />
      {!list ? <p className="empty muted">Loading…</p> : null}
      {list && !list.results.length ? <p className="empty muted">Nothing here yet.</p> : null}
      {view === 'employees' && list ? <EmployeeTable rows={list.results} /> : null}
      {view === 'leave' && list ? <LeaveTable rows={list.results} /> : null}
      {view === 'bonuses' && list ? <BonusTable rows={list.results} /> : null}
      {view === 'lockins' && list ? <LockInTable rows={list.results} /> : null}
      {view === 'visits' && list ? <HubVisitTable rows={list.results} /> : null}
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
