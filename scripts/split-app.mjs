/**
 * One-shot extractor: splits src/App.jsx into feature folders.
 * Run from Frontend/: node scripts/split-app.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = path.join(root, 'src')
const appPath = path.join(src, 'App.jsx')
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/)

function slice(start, end) {
  // 1-based inclusive
  return lines.slice(start - 1, end).join('\n')
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function write(rel, content) {
  const full = path.join(src, rel)
  ensureDir(path.dirname(full))
  fs.writeFileSync(full, content.replace(/\n+$/, '') + '\n', 'utf8')
  console.log('wrote', rel)
}

function move(fromRel, toRel) {
  const from = path.join(src, fromRel)
  const to = path.join(src, toRel)
  ensureDir(path.dirname(to))
  if (!fs.existsSync(from)) {
    console.warn('missing', fromRel)
    return
  }
  fs.renameSync(from, to)
  console.log('moved', fromRel, '->', toRel)
}

// --- move existing assets ---
move('auth.js', 'lib/auth.js')
move('lib.js', 'lib/index.js')
move('App.css', 'styles/App.css')
move('index.css', 'styles/index.css')
move('charts.jsx', 'components/charts/charts.jsx')
move('AuthScreens.jsx', 'features/auth/AuthScreens.jsx')

// fix lib/index.js auth import (same folder now)
{
  const p = path.join(src, 'lib/index.js')
  let t = fs.readFileSync(p, 'utf8')
  // already './auth' — fine
  fs.writeFileSync(p, t)
}

// fix charts import
{
  const p = path.join(src, 'components/charts/charts.jsx')
  let t = fs.readFileSync(p, 'utf8')
  t = t.replace("from './lib'", "from '../../lib'")
  fs.writeFileSync(p, t)
  write('components/charts/index.js', `export * from './charts.jsx'\n`)
}

// fix AuthScreens import
{
  const p = path.join(src, 'features/auth/AuthScreens.jsx')
  let t = fs.readFileSync(p, 'utf8')
  t = t.replace("from './auth'", "from '../../lib/auth'")
  fs.writeFileSync(p, t)
  write(
    'features/auth/index.js',
    `export { LoginScreen, ForgotPasswordScreen, ResetPasswordScreen, ChangePasswordModal } from './AuthScreens.jsx'\n`,
  )
}

// --- config/navigation.js ---
write(
  'config/navigation.js',
  `export const JOBBER_LIST_FILTERS = {
  visits: {
    search: true,
    dates: true,
    division: true,
    employee: true,
    teamLeader: true,
    serviceType: true,
    city: true,
  },
  jobs: {
    search: true,
    dates: true,
    division: true,
    employee: true,
    serviceType: true,
    city: true,
    source: true,
  },
  clients: { search: true },
  invoices: { search: true, dates: true },
}

export const JOBBER_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'oneoff', label: 'One-Off', icon: 'oneoff' },
  { id: 'cancellations', label: 'Cancellations', icon: 'cancellations' },
  { id: 'cx', label: 'Experience', icon: 'cx' },
  { id: 'visits', label: 'Visits', icon: 'visits' },
  { id: 'jobs', label: 'Jobs', icon: 'jobs' },
  { id: 'clients', label: 'Customers', icon: 'clients' },
  { id: 'invoices', label: 'Invoices', icon: 'invoices' },
  { id: 'mappings', label: 'Mappings', icon: 'mappings' },
]

export const JOBBER_BOARD_VIEWS = new Set(['oneoff', 'cancellations', 'cx'])
export const JOBBER_SPECIAL_VIEWS = new Set(['oneoff', 'cancellations', 'cx', 'mappings'])

export const INTERNAL_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'employees', label: 'Employees', icon: 'employees' },
  { id: 'leave', label: 'Leave', icon: 'leave' },
  { id: 'bonuses', label: 'Bonuses', icon: 'bonuses' },
  { id: 'lockins', label: 'Lock-ins', icon: 'lockins' },
]

export const PRICING_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'submissions', label: 'Quotes', icon: 'quotes' },
  { id: 'services', label: 'Services', icon: 'services' },
  { id: 'packages', label: 'Packages', icon: 'packages' },
  { id: 'locations', label: 'Locations', icon: 'locations' },
  { id: 'coupons', label: 'Coupons', icon: 'coupons' },
  { id: 'addons', label: 'Add-ons', icon: 'addons' },
]

export const SOURCE_SIDEBAR = {
  jobber: { title: 'Jobber', subtitle: 'Operations', tone: 'teal' },
  internal: { title: 'Internal', subtitle: 'Contractor hub', tone: 'teal' },
  pricing: { title: 'Pricing', subtitle: 'Quote engine', tone: 'cyan' },
}

export const JOBBER_LIST_PATH = {
  visits: '/api/operations/visits/',
  jobs: '/api/operations/jobs/',
  clients: '/api/operations/clients/',
  invoices: '/api/operations/invoices/',
}

export const INTERNAL_LIST_PATH = {
  employees: '/api/admin-internal/employees/',
  leave: '/api/admin-internal/leave/',
  bonuses: '/api/admin-internal/bonuses/',
  lockins: '/api/admin-internal/lockins/',
  visits: '/api/admin-internal/visits/',
}

export const PRICING_LIST_PATH = {
  submissions: '/api/pricing-calculator/submissions/',
  services: '/api/pricing-calculator/services/',
  packages: '/api/pricing-calculator/packages/',
  locations: '/api/pricing-calculator/locations/',
  coupons: '/api/pricing-calculator/coupons/',
  addons: '/api/pricing-calculator/addons/',
}
`,
)

function exportify(code, names) {
  let out = code
  for (const name of names) {
    out = out.replace(new RegExp(`^function ${name}\\b`, 'm'), `export function ${name}`)
    out = out.replace(new RegExp(`^const ${name}\\b`, 'm'), `export const ${name}`)
  }
  return out
}

// --- layout components ---
write(
  'components/layout/SourceToggle.jsx',
  `export ${slice(93, 107)}\n`,
)

write(
  'components/layout/NavIcon.jsx',
  `export ${slice(109, 243)}\n`,
)

write(
  'components/layout/SideNav.jsx',
  `import { SOURCE_SIDEBAR } from '../../config/navigation'
import { NavIcon } from './NavIcon'

export ${slice(245, 278)}\n`,
)

write(
  'components/layout/ProfileMenu.jsx',
  `import { useEffect, useRef, useState } from 'react'

export ${slice(280, 351)}\n`,
)

write(
  'components/layout/index.js',
  `export { SourceToggle } from './SourceToggle.jsx'
export { NavIcon } from './NavIcon.jsx'
export { SideNav } from './SideNav.jsx'
export { ProfileMenu } from './ProfileMenu.jsx'
`,
)

// --- dashboard shared ---
write(
  'features/dashboard/metrics.jsx',
  `import { useEffect, useState } from 'react'
import { money, number } from '../../lib'

${exportify(slice(1007, 1062), ['formatKpi', 'usePrefersReducedMotion', 'AnimatedMetric'])}
`,
)

write(
  'features/dashboard/Field.jsx',
  `export ${slice(2777, 2785)}\n`,
)

write(
  'features/dashboard/BoardKpiStrip.jsx',
  `import { AnimatedMetric } from './metrics'
import { JOBBER_KPI_META } from '../jobber/icons'

export ${slice(1429, 1452)}\n`,
)

write(
  'features/dashboard/FilterBar.jsx',
  `import { uniqueStrings } from '../../lib'

export ${slice(2151, 2316)}\n`,
)

// --- jobber ---
write(
  'features/jobber/icons.jsx',
  `${exportify(slice(1274, 1405), ['JOBBER_KPI_META', 'RevenueIcon', 'OutstandingIcon', 'ClientsIcon', 'MonthVisitsIcon', 'JobsIcon', 'CompletedIcon', 'CancelledIcon', 'OneOffIcon', 'RecurringIcon', 'AvgPriceIcon', 'JOBBER_TOP_ICONS', 'JOBBER_STRIP_ICONS'])}
`,
)

write(
  'features/jobber/JobberSpark.jsx',
  `export ${slice(1407, 1427)}\n`,
)

write(
  'features/jobber/VisitTable.jsx',
  `import { money, when } from '../../lib'

export ${slice(2744, 2775)}\n`,
)

write(
  'features/jobber/Overview.jsx',
  `import { AreaChart, Donut, JOBBER_COLORS, SegmentedBar } from '../../components/charts'
import { AnimatedMetric } from '../dashboard/metrics'
import { JOBBER_KPI_META, JOBBER_STRIP_ICONS, JOBBER_TOP_ICONS, RevenueIcon } from './icons'
import { JobberSpark } from './JobberSpark'
import { VisitTable } from './VisitTable'

export ${slice(1064, 1272)}\n`,
)

write(
  'features/jobber/boards.jsx',
  `import { AreaChart, JOBBER_COLORS, RankBars, SegmentedBar } from '../../components/charts'
import { money, number, when } from '../../lib'
import { BoardKpiStrip } from '../dashboard/BoardKpiStrip'

${exportify(slice(1454, 1653), ['OneOffBoard', 'CancellationsBoard', 'CxBoard'])}
`,
)

write(
  'features/jobber/MappingsView.jsx',
  `import { useEffect, useState } from 'react'
import { api, readJson } from '../../lib'

${exportify(slice(1655, 1817), ['MappingTable', 'MappingsView'])}
`,
)

write(
  'features/jobber/JobberFilterBar.jsx',
  `import { JOBBER_LIST_FILTERS } from '../../config/navigation'
import { uniqueDivisions, uniqueEmployees, uniqueStrings } from '../../lib'

export ${slice(2360, 2454)}\n`,
)

write(
  'features/jobber/ListView.jsx',
  `import { customerLabel, money, number, when } from '../../lib'
import { JobberFilterBar } from './JobberFilterBar'
import { VisitTable } from './VisitTable'

export ${slice(2456, 2577)}\n`,
)

write(
  'features/jobber/Drawer.jsx',
  `import { money, when } from '../../lib'
import { Field } from '../dashboard/Field'

export ${slice(2787, 2855)}\n`,
)

write(
  'features/jobber/index.js',
  `export { Overview } from './Overview.jsx'
export { OneOffBoard, CancellationsBoard, CxBoard } from './boards.jsx'
export { MappingsView, MappingTable } from './MappingsView.jsx'
export { ListView } from './ListView.jsx'
export { JobberFilterBar } from './JobberFilterBar.jsx'
export { VisitTable } from './VisitTable.jsx'
export { Drawer } from './Drawer.jsx'
export { JobberSpark } from './JobberSpark.jsx'
export * from './icons.jsx'
`,
)

// --- internal ---
write(
  'features/internal/icons.jsx',
  `${exportify(slice(1819, 1923), ['INTERNAL_KPI_META', 'TeamIcon', 'LeaveIcon', 'BonusIcon', 'LockinIcon', 'RateIcon', 'PaidIcon', 'VisitsIcon', 'VacationIcon', 'INTERNAL_TOP_ICONS', 'INTERNAL_STRIP_ICONS'])}
`,
)

write(
  'features/internal/RoleSpark.jsx',
  `export ${slice(1925, 1941)}\n`,
)

write(
  'features/internal/tables.jsx',
  `import { money, number, when } from '../../lib'

${exportify(slice(2579, 2742), ['EmployeeTable', 'LeaveTable', 'BonusTable', 'LockInTable', 'HubVisitTable'])}
`,
)

write(
  'features/internal/InternalOverview.jsx',
  `import { ColumnChart, INTERNAL_COLORS, RankBars, SegmentedBar } from '../../components/charts'
import { AnimatedMetric } from '../dashboard/metrics'
import { INTERNAL_KPI_META, INTERNAL_STRIP_ICONS, INTERNAL_TOP_ICONS, TeamIcon } from './icons'
import { RoleSpark } from './RoleSpark'
import { LeaveTable } from './tables'

export ${slice(1943, 2149)}\n`,
)

write(
  'features/internal/InternalListView.jsx',
  `import { number } from '../../lib'
import { FilterBar } from '../dashboard/FilterBar'
import { BonusTable, EmployeeTable, HubVisitTable, LeaveTable, LockInTable } from './tables'

export ${slice(2318, 2358)}\n`,
)

write(
  'features/internal/index.js',
  `export { InternalOverview } from './InternalOverview.jsx'
export { InternalListView } from './InternalListView.jsx'
export { RoleSpark } from './RoleSpark.jsx'
export { EmployeeTable, LeaveTable, BonusTable, LockInTable, HubVisitTable } from './tables.jsx'
export * from './icons.jsx'
`,
)

// --- pricing ---
write(
  'features/pricing/MiniSpark.jsx',
  `export ${slice(2883, 2906)}\n`,
)

write(
  'features/pricing/icons.jsx',
  `${exportify(slice(2857, 2881) + '\n\n' + slice(2908, 2995), ['PRICING_KPI_META', 'MoneyIcon', 'QuotesIcon', 'AvgIcon', 'PipelineIcon', 'ServicesIcon', 'LocationsIcon', 'CouponsIcon', 'AddonsIcon', 'TOP_STAT_ICONS', 'STRIP_STAT_ICONS'])}
`,
)

write(
  'features/pricing/tables.jsx',
  `import { money, when } from '../../lib'

${exportify(slice(3310, 3369), ['PricingSubmissionTable', 'SimplePricingTable'])}
`,
)

write(
  'features/pricing/PricingOverview.jsx',
  `import { ColumnChart, RankBars, SegmentedBar } from '../../components/charts'
import { number } from '../../lib'
import { AnimatedMetric } from '../dashboard/metrics'
import { MoneyIcon, PRICING_KPI_META, STRIP_STAT_ICONS, TOP_STAT_ICONS } from './icons'
import { MiniSpark } from './MiniSpark'
import { PricingSubmissionTable } from './tables'

export ${slice(2997, 3213)}\n`,
)

write(
  'features/pricing/PricingListView.jsx',
  `import { money, number } from '../../lib'
import { FilterBar } from '../dashboard/FilterBar'
import { PricingSubmissionTable, SimplePricingTable } from './tables'

export ${slice(3215, 3308)}\n`,
)

write(
  'features/pricing/PricingDrawer.jsx',
  `import { money, number, when } from '../../lib'
import { Field } from '../dashboard/Field'

export ${slice(3371, 3401)}\n`,
)

write(
  'features/pricing/index.js',
  `export { PricingOverview } from './PricingOverview.jsx'
export { PricingListView } from './PricingListView.jsx'
export { PricingDrawer } from './PricingDrawer.jsx'
export { MiniSpark } from './MiniSpark.jsx'
export { PricingSubmissionTable, SimplePricingTable } from './tables.jsx'
export * from './icons.jsx'
`,
)

write(
  'features/dashboard/index.js',
  `export { formatKpi, usePrefersReducedMotion, AnimatedMetric } from './metrics.jsx'
export { Field } from './Field.jsx'
export { BoardKpiStrip } from './BoardKpiStrip.jsx'
export { FilterBar } from './FilterBar.jsx'
export { DashboardPage } from './DashboardPage.jsx'
`,
)

// --- DashboardPage: App body without auth UI ---
{
  let body = slice(353, 1005)
  // rename App -> DashboardPage and accept auth props
  body = body.replace(/^function App\(\) \{/, 'export function DashboardPage({ user, onLogout, loggingOut, onChangePassword }) {')
  // drop auth-only state
  body = body.replace(
    `  const [authReady, setAuthReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [authUser, setAuthUser] = useState(getStoredUser())
  const [showChangePassword, setShowChangePassword] = useState(false)
`,
    '',
  )
  body = body.replace(`  const [loggingOut, setLoggingOut] = useState(false)\n\n`, '')
  // drop auth boot effect
  body = body.replace(
    /  useEffect\(\(\) => \{\n    let cancelled = false\n    async function bootAuth\(\) \{[\s\S]*?    bootAuth\(\)\n    return \(\) => \{\n      cancelled = true\n    \}\n  \}, \[\]\)\n\n/,
    '',
  )
  // effects that gated on authed — always run when mounted (parent only mounts when authed)
  body = body.replace(/if \(!authed\) return undefined\n    /g, '')
  body = body.replace(/, \[authed\]\)/g, ', [])')
  body = body.replace(/, \[source, authed\]\)/g, ', [source])')
  // remove logout/login handlers and change-password modal from this page
  body = body.replace(
    /  async function handleLogout\(\) \{[\s\S]*?\n  \}\n\n  function handleLoginSuccess\(\) \{[\s\S]*?\n  \}\n\n/,
    '',
  )
  // remove authReady / !authed gates
  body = body.replace(
    /  if \(!authReady\) \{\n    return <div className="content muted">Loading…<\/div>\n  \}\n\n  if \(!authed\) \{\n    return <LoginScreen onSuccess=\{handleLoginSuccess\} \/>\n  \}\n\n/,
    '',
  )
  // ChangePasswordModal owned by App wrapper
  body = body.replace(
    /      \{showChangePassword \? \(\n        <ChangePasswordModal onClose=\{\(\) => setShowChangePassword\(false\)\} \/>\n      \) : null\}\n/,
    '',
  )
  body = body.replace(/authUser/g, 'user')
  body = body.replace(
    /onChangePassword=\{\(\) => setShowChangePassword\(true\)\}/,
    'onChangePassword={onChangePassword}',
  )
  body = body.replace(/onLogout=\{handleLogout\}/, 'onLogout={onLogout}')

  const header = `import { useEffect, useMemo, useState } from 'react'
import '../../styles/App.css'
import {
  JOBBER_BOARD_VIEWS,
  JOBBER_LIST_PATH,
  JOBBER_NAV,
  JOBBER_SPECIAL_VIEWS,
  INTERNAL_LIST_PATH,
  INTERNAL_NAV,
  PRICING_LIST_PATH,
  PRICING_NAV,
} from '../../config/navigation'
import { ProfileMenu, SideNav, SourceToggle } from '../../components/layout'
import {
  API,
  api,
  number,
  queryString,
  readJson,
  relative,
  uniqueDivisions,
} from '../../lib'
import { Overview, OneOffBoard, CancellationsBoard, CxBoard, MappingsView, ListView, Drawer } from '../jobber'
import { InternalOverview, InternalListView } from '../internal'
import { PricingOverview, PricingListView, PricingDrawer } from '../pricing'

`

  write('features/dashboard/DashboardPage.jsx', header + body + '\n')
}

// thin App.jsx with auth shell
write(
  'App.jsx',
  `import { useEffect, useState } from 'react'
import { ChangePasswordModal, LoginScreen } from './features/auth'
import { DashboardPage } from './features/dashboard'
import { clearAuth, getStoredUser, logoutRequest, restoreSession } from './lib'

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [authUser, setAuthUser] = useState(getStoredUser())
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function bootAuth() {
      try {
        const user = await restoreSession()
        if (!cancelled) {
          setAuthUser(user)
          setAuthed(true)
        }
      } catch {
        clearAuth()
        if (!cancelled) {
          setAuthed(false)
          setAuthUser(null)
        }
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }
    bootAuth()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logoutRequest()
    } finally {
      setAuthed(false)
      setAuthUser(null)
      setShowChangePassword(false)
      setLoggingOut(false)
    }
  }

  function handleLoginSuccess() {
    setAuthUser(getStoredUser())
    setAuthed(true)
  }

  if (!authReady) {
    return <div className="content muted">Loading…</div>
  }

  if (!authed) {
    return <LoginScreen onSuccess={handleLoginSuccess} />
  }

  return (
    <>
      {showChangePassword ? (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      ) : null}
      <DashboardPage
        user={authUser}
        loggingOut={loggingOut}
        onChangePassword={() => setShowChangePassword(true)}
        onLogout={handleLogout}
      />
    </>
  )
}
`,
)

// update main.jsx css path
{
  const p = path.join(src, 'main.jsx')
  let t = fs.readFileSync(p, 'utf8')
  t = t.replace("import './index.css'", "import './styles/index.css'")
  fs.writeFileSync(p, t)
  console.log('updated main.jsx')
}

console.log('Done.')
