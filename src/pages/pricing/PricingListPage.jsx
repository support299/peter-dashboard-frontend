import { PricingListView } from '../../features/pricing'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export function PricingListPage({ view }) {
  const { list, search, setSearch, filters, setFilter, filterOptions, loadList, openDetail } = useDashboard()
  return (
    <PricingListView
      view={view}
      list={list}
      search={search}
      setSearch={setSearch}
      filters={filters}
      setFilter={setFilter}
      filterOptions={filterOptions}
      onPage={loadList}
      onOpen={openDetail}
    />
  )
}
