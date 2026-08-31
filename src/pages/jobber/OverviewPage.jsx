import { Overview } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberOverviewPage() {
  const { dash, openView, openDetail } = useDashboard()
  if (!dash?.charts?.revenue) return null
  return <Overview dash={dash} onKpi={openView} onDetail={openDetail} />
}
