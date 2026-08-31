import { CxBoard } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberCxPage() {
  const { board } = useDashboard()
  return <CxBoard dash={board} />
}
