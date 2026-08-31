import fs from 'fs'
import path from 'path'

const root = path.resolve('src/pages')

function write(rel, content) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content.trimStart())
}

write(
  'auth/LoginPage.jsx',
  `
import { useAuth } from '../../app/providers/AuthProvider'
import { LoginScreen } from '../../features/auth'

export default function LoginPage() {
  const { loginSuccess } = useAuth()
  return <LoginScreen onSuccess={loginSuccess} />
}
`,
)

write(
  'jobber/JobberListPage.jsx',
  `
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
`,
)

const jobberPages = {
  OverviewPage: `
import { Overview } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberOverviewPage() {
  const { dash, openView, openDetail } = useDashboard()
  if (!dash?.charts?.revenue) return null
  return <Overview dash={dash} onKpi={openView} onDetail={openDetail} />
}
`,
  OneOffPage: `
import { OneOffBoard } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberOneOffPage() {
  const { board, openView } = useDashboard()
  return <OneOffBoard dash={board} onKpi={openView} />
}
`,
  CancellationsPage: `
import { CancellationsBoard } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberCancellationsPage() {
  const { board, openView } = useDashboard()
  return <CancellationsBoard dash={board} onKpi={openView} />
}
`,
  CxPage: `
import { CxBoard } from '../../features/jobber'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function JobberCxPage() {
  const { board } = useDashboard()
  return <CxBoard dash={board} />
}
`,
  MappingsPage: `
import { MappingsView } from '../../features/jobber'

export default function JobberMappingsPage() {
  return <MappingsView />
}
`,
  VisitsPage: `
import { JobberListPage } from './JobberListPage'
export default function JobberVisitsPage() {
  return <JobberListPage view="visits" />
}
`,
  JobsPage: `
import { JobberListPage } from './JobberListPage'
export default function JobberJobsPage() {
  return <JobberListPage view="jobs" />
}
`,
  ClientsPage: `
import { JobberListPage } from './JobberListPage'
export default function JobberClientsPage() {
  return <JobberListPage view="clients" />
}
`,
  InvoicesPage: `
import { JobberListPage } from './JobberListPage'
export default function JobberInvoicesPage() {
  return <JobberListPage view="invoices" />
}
`,
}

for (const [name, content] of Object.entries(jobberPages)) {
  write(`jobber/${name}.jsx`, content)
}

write(
  'internal/InternalListPage.jsx',
  `
import { InternalListView } from '../../features/internal'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export function InternalListPage({ view }) {
  const { list, search, setSearch, filters, setFilter, filterOptions, loadList } = useDashboard()
  return (
    <InternalListView
      view={view}
      list={list}
      search={search}
      setSearch={setSearch}
      filters={filters}
      setFilter={setFilter}
      filterOptions={filterOptions}
      onPage={loadList}
    />
  )
}
`,
)

write(
  'internal/OverviewPage.jsx',
  `
import { InternalOverview } from '../../features/internal'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function InternalOverviewPage() {
  const { dash, openView } = useDashboard()
  if (!dash?.kpis) return null
  return <InternalOverview dash={dash} onKpi={openView} />
}
`,
)

for (const [file, view] of [
  ['EmployeesPage', 'employees'],
  ['LeavePage', 'leave'],
  ['BonusesPage', 'bonuses'],
  ['LockinsPage', 'lockins'],
]) {
  write(
    `internal/${file}.jsx`,
    `
import { InternalListPage } from './InternalListPage'
export default function Internal${file}() {
  return <InternalListPage view="${view}" />
}
`,
  )
}

write(
  'pricing/PricingListPage.jsx',
  `
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
`,
)

write(
  'pricing/OverviewPage.jsx',
  `
import { PricingOverview } from '../../features/pricing'
import { useDashboard } from '../../features/dashboard/DashboardProvider'

export default function PricingOverviewPage() {
  const { dash, openView, openDetail } = useDashboard()
  if (!dash?.kpis) return null
  return <PricingOverview dash={dash} onKpi={openView} onOpen={openDetail} />
}
`,
)

for (const [file, view] of [
  ['SubmissionsPage', 'submissions'],
  ['ServicesPage', 'services'],
  ['PackagesPage', 'packages'],
  ['LocationsPage', 'locations'],
  ['CouponsPage', 'coupons'],
  ['AddonsPage', 'addons'],
]) {
  write(
    `pricing/${file}.jsx`,
    `
import { PricingListPage } from './PricingListPage'
export default function Pricing${file}() {
  return <PricingListPage view="${view}" />
}
`,
  )
}

console.log('ok')
