import { InternalListView } from '../../features/internal'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export function InternalListPage({ view }) {
  const { list, search, setSearch, filters, setFilter, filterOptions, loadList } = useDashboard()
  return (
    <InternalListView
      view={view}
      list={list}
      search={search}
      setSearch={setSearch}
      filters={filters}
      setFilter={setFilter}
      filterOptions={filterOptions}
      onPage={loadList}
    />
  )
}
