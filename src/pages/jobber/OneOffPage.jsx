import { OneOffBoard } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberOneOffPage() {
  const { board, openView } = useDashboard()
  return <OneOffBoard dash={board} onKpi={openView} />
}
