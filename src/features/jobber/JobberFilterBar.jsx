import { JOBBER_LIST_FILTERS } from '../../config/navigation'
import { uniqueDivisions, uniqueEmployees, uniqueStrings } from '../../lib'

export function JobberFilterBar({ filters, setFilter, patchFilters, filterOptions, search, setSearch, view }) {
  const config = JOBBER_LIST_FILTERS[view] || { search: true }
  const employees = uniqueEmployees(Array.isArray(filterOptions?.employees) ? filterOptions.employees : [])
  const divisions = uniqueDivisions(Array.isArray(filterOptions?.divisions) ? filterOptions.divisions : [])
  const serviceTypes = uniqueStrings(Array.isArray(filterOptions?.service_types) ? filterOptions.service_types : [])
  const cities = uniqueStrings(Array.isArray(filterOptions?.cities) ? filterOptions.cities : [])
  const sources = uniqueStrings(Array.isArray(filterOptions?.sources) ? filterOptions.sources : [])
  const staffValue = view === 'jobs' ? filters.employee || filters.team_leader || '' : filters.employee || ''

  function setStaffFilter(value) {
    if (view === 'jobs') {
      patchFilters({ employee: value || null, team_leader: null })
      return
    }
    setFilter('employee', value)
  }

  return (
    <div className="toolbar filters">
      {config.search ? (
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={view === 'clients' ? 'Search customers' : `Search ${view}`}
        />
      ) : null}
      {config.dates ? (
        <>
          <input type="date" value={filters.from || ''} onChange={(e) => setFilter('from', e.target.value)} />
          <input type="date" value={filters.to || ''} onChange={(e) => setFilter('to', e.target.value)} />
        </>
      ) : null}
      {config.division ? (
        <select value={filters.division || ''} onChange={(e) => setFilter('division', e.target.value)}>
          <option value="">All divisions</option>
          {divisions.map((item) => (
            <option key={item.key || item} value={item.key || item}>
              {item.label || item}
            </option>
          ))}
        </select>
      ) : null}
      {config.employee ? (
        <select value={staffValue} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="">{view === 'jobs' ? 'All employees / team leaders' : 'All employees'}</option>
          {employees.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      ) : null}
      {config.teamLeader ? (
        <select value={filters.team_leader || ''} onChange={(e) => setFilter('team_leader', e.target.value)}>
          <option value="">All team leaders</option>
          {employees.map((item) => (
            <option key={`tl-${item.id}`} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      ) : null}
      {config.serviceType ? (
        <select value={filters.service_type || ''} onChange={(e) => setFilter('service_type', e.target.value)}>
          <option value="">All service types</option>
          {serviceTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ) : null}
      {config.city ? (
        <select value={filters.city || ''} onChange={(e) => setFilter('city', e.target.value)}>
          <option value="">All cities</option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ) : null}
      {config.source ? (
        <select value={filters.source || ''} onChange={(e) => setFilter('source', e.target.value)}>
          <option value="">All sales sources</option>
          {sources.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}
