import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from './guards'
import { DashboardLayout } from '../../features/dashboard/DashboardLayout'
import LoginPage from '../../pages/auth/LoginPage'

import JobberOverviewPage from '../../pages/jobber/OverviewPage'
import JobberOneOffPage from '../../pages/jobber/OneOffPage'
import JobberCancellationsPage from '../../pages/jobber/CancellationsPage'
import JobberCxPage from '../../pages/jobber/CxPage'
import JobberVisitsPage from '../../pages/jobber/VisitsPage'
import JobberJobsPage from '../../pages/jobber/JobsPage'
import JobberClientsPage from '../../pages/jobber/ClientsPage'
import JobberInvoicesPage from '../../pages/jobber/InvoicesPage'
import JobberMappingsPage from '../../pages/jobber/MappingsPage'

import InternalOverviewPage from '../../pages/internal/OverviewPage'
import InternalEmployeesPage from '../../pages/internal/EmployeesPage'
import InternalLeavePage from '../../pages/internal/LeavePage'
import InternalBonusesPage from '../../pages/internal/BonusesPage'
import InternalLockinsPage from '../../pages/internal/LockinsPage'

import PricingOverviewPage from '../../pages/pricing/OverviewPage'
import PricingSubmissionsPage from '../../pages/pricing/SubmissionsPage'
import PricingServicesPage from '../../pages/pricing/ServicesPage'
import PricingPackagesPage from '../../pages/pricing/PackagesPage'
import PricingLocationsPage from '../../pages/pricing/LocationsPage'
import PricingCouponsPage from '../../pages/pricing/CouponsPage'
import PricingAddonsPage from '../../pages/pricing/AddonsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/jobber/overview" replace />} />

          <Route path="jobber">
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<JobberOverviewPage />} />
            <Route path="oneoff" element={<JobberOneOffPage />} />
            <Route path="cancellations" element={<JobberCancellationsPage />} />
            <Route path="cx" element={<JobberCxPage />} />
            <Route path="visits" element={<JobberVisitsPage />} />
            <Route path="jobs" element={<JobberJobsPage />} />
            <Route path="clients" element={<JobberClientsPage />} />
            <Route path="invoices" element={<JobberInvoicesPage />} />
            <Route path="mappings" element={<JobberMappingsPage />} />
          </Route>

          <Route path="internal">
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<InternalOverviewPage />} />
            <Route path="employees" element={<InternalEmployeesPage />} />
            <Route path="leave" element={<InternalLeavePage />} />
            <Route path="bonuses" element={<InternalBonusesPage />} />
            <Route path="lockins" element={<InternalLockinsPage />} />
          </Route>

          <Route path="pricing">
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<PricingOverviewPage />} />
            <Route path="submissions" element={<PricingSubmissionsPage />} />
            <Route path="services" element={<PricingServicesPage />} />
            <Route path="packages" element={<PricingPackagesPage />} />
            <Route path="locations" element={<PricingLocationsPage />} />
            <Route path="coupons" element={<PricingCouponsPage />} />
            <Route path="addons" element={<PricingAddonsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/jobber/overview" replace />} />
    </Routes>
  )
}
