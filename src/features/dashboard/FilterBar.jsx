import { uniqueStrings } from '../../lib'

export function FilterBar({ view, filters, setFilter, filterOptions, search, setSearch }) {
  const employees = filterOptions?.employees || {}
  const leave = filterOptions?.leave || {}
  const bonuses = filterOptions?.bonuses || {}
  const lockins = filterOptions?.lockins || {}
  const visits = filterOptions?.visits || {}

  return (
    <div className="toolbar filters">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={`Search ${view}`}
      />
      {view === 'employees' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {uniqueStrings(employees.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.role || ''} onChange={(e) => setFilter('role', e.target.value)}>
            <option value="">All roles</option>
            {uniqueStrings(employees.roles || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.position || ''} onChange={(e) => setFilter('position', e.target.value)}>
            <option value="">All positions</option>
            {uniqueStrings(employees.positions || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </>
      ) : null}
      {view === 'leave' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {uniqueStrings(leave.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.leave_type || ''} onChange={(e) => setFilter('leave_type', e.target.value)}>
            <option value="">All types</option>
            {uniqueStrings(leave.types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input type="date" value={filters.from || ''} onChange={(e) => setFilter('from', e.target.value)} />
          <input type="date" value={filters.to || ''} onChange={(e) => setFilter('to', e.target.value)} />
        </>
      ) : null}
      {view === 'bonuses' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {uniqueStrings(bonuses.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.bonus_type || ''} onChange={(e) => setFilter('bonus_type', e.target.value)}>
            <option value="">All types</option>
            {uniqueStrings(bonuses.types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.paid || ''} onChange={(e) => setFilter('paid', e.target.value)}>
            <option value="">Paid or unpaid</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
          </select>
        </>
      ) : null}
      {view === 'lockins' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {uniqueStrings(lockins.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.locked_in || ''} onChange={(e) => setFilter('locked_in', e.target.value)}>
            <option value="">Locked or pending</option>
            <option value="true">Locked in</option>
            <option value="false">Not locked</option>
          </select>
        </>
      ) : null}
      {view === 'visits' ? (
        <>
          <select value={filters.job_type || ''} onChange={(e) => setFilter('job_type', e.target.value)}>
            <option value="">All job types</option>
            {uniqueStrings(visits.job_types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input type="date" value={filters.from || ''} onChange={(e) => setFilter('from', e.target.value)} />
          <input type="date" value={filters.to || ''} onChange={(e) => setFilter('to', e.target.value)} />
        </>
      ) : null}
      {view === 'submissions' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {uniqueStrings(filterOptions?.submissions?.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.property_type || ''} onChange={(e) => setFilter('property_type', e.target.value)}>
            <option value="">All property types</option>
            {uniqueStrings(filterOptions?.submissions?.property_types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.location || ''} onChange={(e) => setFilter('location', e.target.value)}>
            <option value="">All locations</option>
            {uniqueStrings(filterOptions?.submissions?.locations || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.coupon || ''} onChange={(e) => setFilter('coupon', e.target.value)}>
            <option value="">Coupon any</option>
            <option value="true">With coupon</option>
            <option value="false">No coupon</option>
          </select>
        </>
      ) : null}
      {view === 'packages' ? (
        <select value={filters.service || ''} onChange={(e) => setFilter('service', e.target.value)}>
          <option value="">All services</option>
          {uniqueStrings(filterOptions?.packages?.services || []).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}
