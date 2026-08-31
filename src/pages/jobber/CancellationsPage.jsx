import { CancellationsBoard } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberCancellationsPage() {
  const { board, openView } = useDashboard()
  return <CancellationsBoard dash={board} onKpi={openView} />
}
