import { PricingOverview } from '../../features/pricing'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function PricingOverviewPage() {
  const { dash, openView, openDetail } = useDashboard()
  if (!dash?.kpis) return null
  return <PricingOverview dash={dash} onKpi={openView} onOpen={openDetail} />
}
