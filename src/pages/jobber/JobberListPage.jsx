import { ListView } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export function JobberListPage({ view }) {
  const { list, search, setSearch, filters, setFilter, patchFilters, filterOptions, loadList, openDetail } = useDashboard()
  return (
    <ListView
      view={view}
      list={list}
      search={search}
      setSearch={setSearch}
      filters={filters}
      setFilter={setFilter}
      patchFilters={patchFilters}
      filterOptions={filterOptions}
      onPage={loadList}
      onOpen={openDetail}
    />
  )
}
