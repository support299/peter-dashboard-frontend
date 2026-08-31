import { money, number } from '../../lib'
import { FilterBar } from '../dashboard/FilterBar'
import { PricingSubmissionTable, SimplePricingTable } from './tables'

export function PricingListView({ view, list, search, setSearch, filters, setFilter, filterOptions, onPage, onOpen }) {
  return (
    <article className="pricing-panel internal-list anim-rise" style={{ '--delay': '80ms' }}>
      <header className="panel-head">
        <div>
          <h3>{view.charAt(0).toUpperCase() + view.slice(1)}</h3>
          <p>Filter and search stored pricing records</p>
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
      {view === 'submissions' && list ? (
        <PricingSubmissionTable rows={list.results} onOpen={(id) => onOpen('submissions', id)} />
      ) : null}
      {view === 'services' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Service' },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
            { key: 'residential', label: 'Residential', render: (row) => (row.residential ? 'Yes' : '—') },
            { key: 'commercial', label: 'Commercial', render: (row) => (row.commercial ? 'Yes' : '—') },
          ]}
        />
      ) : null}
      {view === 'packages' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Package' },
            { key: 'service', label: 'Service' },
            { key: 'base_price', label: 'Base', render: (row) => money(row.base_price) },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
          ]}
        />
      ) : null}
      {view === 'locations' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Location' },
            { key: 'address', label: 'Address' },
            { key: 'trip_surcharge', label: 'Trip fee', render: (row) => money(row.trip_surcharge) },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
          ]}
        />
      ) : null}
      {view === 'coupons' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'percent', label: 'Percent', render: (row) => (row.percent != null ? `${row.percent}%` : '—') },
            { key: 'fixed', label: 'Fixed', render: (row) => (row.fixed != null ? money(row.fixed) : '—') },
            { key: 'used', label: 'Used' },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
          ]}
        />
      ) : null}
      {view === 'addons' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Add-on' },
            { key: 'base_price', label: 'Price', render: (row) => money(row.base_price) },
            { key: 'global', label: 'Global', render: (row) => (row.global ? 'Yes' : 'No') },
          ]}
        />
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
