import { InternalOverview } from '../../features/internal'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function InternalOverviewPage() {
  const { dash, openView } = useDashboard()
  if (!dash?.kpis) return null
  return <InternalOverview dash={dash} onKpi={openView} />
}
