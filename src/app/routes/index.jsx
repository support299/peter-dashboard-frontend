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

import JobberMrrPage from '../../pages/jobber/MrrPage'

import MasterOverviewPage from '../../pages/master/OverviewPage'
import MasterRevenuePage from '../../pages/master/RevenuePage'
import MasterClientsPage from '../../pages/master/ClientsPage'
import MasterMrrPage from '../../pages/master/MrrPage'
import MasterCancellationsPage from '../../pages/master/CancellationsPage'
import MasterOperationsPage from '../../pages/master/OperationsPage'
import MasterQualityPage from '../../pages/master/QualityPage'
import MasterSalesPage from '../../pages/master/SalesPage'
import MasterAlertsPage from '../../pages/master/AlertsPage'
import MasterRulesPage from '../../pages/master/RulesPage'
import MasterManagerPage from '../../pages/master/ManagerPage'
import MasterUsersPage from '../../pages/master/UsersPage'

import FinancialsExpensesPage from '../../pages/financials/ExpensesPage'
import FinancialsEntriesPage from '../../pages/financials/EntriesPage'
import FinancialsPayrollPage from '../../pages/financials/PayrollPage'
import FinancialsContractorPayPage from '../../pages/financials/ContractorPayPage'
import FinancialsRecurringPage from '../../pages/financials/RecurringPage'
import FinancialsTotalsPage from '../../pages/financials/TotalsPage'
import FinancialsPnlPage from '../../pages/financials/PnlPage'
import FinancialsCashPage from '../../pages/financials/CashPage'
import FinancialsReportsPage from '../../pages/financials/ReportsPage'
import FinancialsReviewPage from '../../pages/financials/ReviewPage'
import FinancialsSettingsPage from '../../pages/financials/SettingsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/master/overview" replace />} />

          <Route path="master">
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<MasterOverviewPage />} />
            <Route path="revenue" element={<MasterRevenuePage />} />
            <Route path="clients" element={<MasterClientsPage />} />
            <Route path="mrr" element={<MasterMrrPage />} />
            <Route path="cancellations" element={<MasterCancellationsPage />} />
            <Route path="operations" element={<MasterOperationsPage />} />
            <Route path="quality" element={<MasterQualityPage />} />
            <Route path="sales" element={<MasterSalesPage />} />
            <Route path="alerts" element={<MasterAlertsPage />} />
            <Route path="rules" element={<MasterRulesPage />} />
            <Route path="manager" element={<MasterManagerPage />} />
            <Route path="users" element={<MasterUsersPage />} />
          </Route>

          <Route path="financials">
            <Route index element={<Navigate to="expenses" replace />} />
            <Route path="expenses" element={<FinancialsExpensesPage />} />
            <Route path="entries" element={<FinancialsEntriesPage />} />
            <Route path="payroll" element={<FinancialsPayrollPage />} />
            <Route path="contractor-pay" element={<FinancialsContractorPayPage />} />
            <Route path="recurring" element={<FinancialsRecurringPage />} />
            <Route path="totals" element={<FinancialsTotalsPage />} />
            <Route path="pnl" element={<FinancialsPnlPage />} />
            <Route path="cash" element={<FinancialsCashPage />} />
            <Route path="reports" element={<FinancialsReportsPage />} />
            <Route path="review" element={<FinancialsReviewPage />} />
            <Route path="settings" element={<FinancialsSettingsPage />} />
          </Route>

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
            <Route path="mrr" element={<JobberMrrPage />} />
            <Route path="mappings" element={<JobberMappingsPage />} />
          </Route>

          <Route path="internal">
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<InternalOverviewPage />} />
            <Route path="employees" element={<InternalEmployeesPage />} />
            <Route path="leave" element={<InternalLeavePage />} />
            <Route path="bonuses" element={<InternalBonusesPage />} />
            <Route path="lockins" element={<InternalLockinsPage />} />
            <Route path="mrr" element={<Navigate to="/jobber/mrr" replace />} />
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

      <Route path="*" element={<Navigate to="/master/overview" replace />} />
    </Routes>
  )
}
