import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { ProfileMenu, SideNav, SourceToggle } from '../../components/layout'
import { JOBBER_BOARD_VIEWS } from '../../config/navigation'
import { API, number, relative, uniqueDivisions } from '../../lib'
import { ChangePasswordModal } from '../auth'
import { Drawer } from '../jobber'
import { PricingDrawer } from '../pricing'
import { DashboardProvider, useDashboard } from './DashboardProvider'
import { PeriodProvider } from '../master/PeriodContext'
import '../../styles/App.css'
import { SkeletonApp } from '../../components/Skeleton'

const MASTER_SUBTITLES = {
  overview: 'Is the company healthy, and what changed? Click any number to see why.',
  manager: 'How the business is doing, what needs attention, and staffing.',
  revenue: 'Revenue by type and division, profitability, top clients and receivables.',
  clients: 'Are we gaining or losing clients, and are recurring clients growing?',
  mrr: 'Monthly recurring revenue: what we added, what we lost, and paused clients.',
  sales: 'Leads from the calculator and Jobber, how many become clients, and what each one costs.',
  cancellations: 'How much revenue cancellations cost us, and why they happen.',
  operations: 'Hours, overtime, revenue per labour hour and absences.',
  quality: 'Touch-ups, feedback, complaints and reviews.',
  alerts: 'Set limits on any number. Crossed limits are flagged on the cards and the CEO view.',
  rules: 'How Jobber line items are sorted into divisions and revenue types.',
  users: 'Add people and choose what each one can see.',
}

const FINANCIALS_SUBTITLES = {
  expenses: 'What we spend, by group, category and division, compared with earlier periods.',
  entries: 'Add, find and correct expenses. Attach a photo or PDF of the receipt.',
  payroll: 'One entry per PayEvo pay run: cleaning staff and office, counted in the pay-date month.',
  recurring: 'Rent, insurance, software… Each charge is created on its due date for you to verify.',
  totals: 'Monthly totals by category, reconciliation, and CSV / Excel import.',
  pnl: 'Revenue from Jobber minus expenses from Financials.',
  cash: 'Bank balances, credit cards and loans, updated by hand.',
  reports: 'Month-by-month profit & loss to download or print.',
  review: 'Check each month before marking it reviewed. Reviewed months are locked.',
  settings: 'Expense categories and who can use Financials.',
}

function DashboardShell() {
  const {
    source,
    view,
    financeRole,
    limited,
    allowedSources,
    jobber,
    filters,
    filterOptions,
    detail,
    error,
    busy,
    connected,
    syncing,
    nav,
    title,
    updatedAt,
    showJobberConnect,
    showInternalEmpty,
    showPricingEmpty,
    ready,
    list,
    refresh,
    switchSource,
    openView,
    openDetail,
    goBack,
    setFilter,
  } = useDashboard()
  const { user, loggingOut, logout, showChangePassword, setShowChangePassword } = useAuth()
  const { search } = useLocation()
  // TV view (Peter, Nov 2026): the Manager overview alone on a wall screen, address ends in ?tv=1.
  const tv = source === 'master' && view === 'manager' && new URLSearchParams(search).get('tv') === '1'

  if (!ready) {
    return <SkeletonApp />
  }

  const layoutClass =
    source === 'internal' ? 'layout internal' : source === 'pricing' ? 'layout pricing' : ['jobber', 'master', 'financials'].includes(source) ? 'layout jobber' : 'layout'

  return (
    <div className={`app${tv ? ' tv-mode' : ''}`}>
      {showChangePassword ? (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      ) : null}
      <header className="topbar" hidden={tv}>
        <div className="brand">
          <div className="mark">P</div>
          <div>
            <h1>Peter</h1>
            <p>
              {source === 'master'
                ? 'Master Dashboard'
                : source === 'financials'
                ? 'Financials'
                : source === 'jobber'
                ? jobber?.account_name || 'Jobber'
                : source === 'internal'
                  ? 'Contractor Hub'
                  : 'Pricing Calculator'}
            </p>
          </div>
        </div>

        {/* Limited users see only the sections they may open; with just one there's nothing to switch to. */}
        {limited && allowedSources.length < 2 ? (
          <span />
        ) : (
          <SourceToggle source={source} onChange={switchSource} showFinancials={Boolean(financeRole)} allowed={limited ? allowedSources : undefined} />
        )}

        <div className="topbar-actions">
          <span className="hint">
            {syncing ? 'Updating…' : updatedAt ? `Updated ${relative(updatedAt)}` : 'Not synced yet'}
          </span>
          {limited ? null : (
            <button
              className="ghost"
              type="button"
              onClick={refresh}
              disabled={busy || syncing || (['jobber', 'master', 'financials'].includes(source) && !connected)}
            >
              {syncing ? 'Refreshing…' : ['jobber', 'master', 'financials'].includes(source) ? 'Refresh' : source === 'internal' ? 'Sync Internal' : 'Sync Pricing'}
            </button>
          )}
          <ProfileMenu
            user={user}
            loggingOut={loggingOut}
            onChangePassword={() => setShowChangePassword(true)}
            onLogout={logout}
          />
        </div>
      </header>

      {showJobberConnect ? (
        <main className="content">
          {error ? <div className="notice">{error}</div> : null}
          <section className="connect">
            <p className="hint">Peter</p>
            <h2>Connect your Jobber account</h2>
            <p className="muted">We’ll bring in jobs, visits, customers, and invoices so you can see the business at a glance.</p>
            <p>
              <a className="primary" href={`${API}/api/jobber/connect/`} style={{ display: 'inline-flex', marginTop: 18, textDecoration: 'none' }}>
                Connect Jobber
              </a>
            </p>
          </section>
        </main>
      ) : null}

      {!showJobberConnect ? (
        <div className={layoutClass}>
          {tv ? null : <SideNav source={source} items={nav} view={view} onOpen={openView} />}

          <main className="content">
            {error ? <div className="notice">{error}</div> : null}

            <section className={`hero ${source !== 'jobber' ? 'hero-internal' : ''}`} hidden={tv}>
              <div>
                {((view !== 'overview' && source !== 'financials') || detail) && !(limited && source === 'master' && !detail) ? (
                  <button className="back" type="button" onClick={goBack}>
                    ← Back
                  </button>
                ) : null}
                {source === 'master' ? <p className="hero-kicker jobber-kicker">Management</p> : null}
                {source === 'financials' ? <p className="hero-kicker jobber-kicker">Financials</p> : null}
                {source === 'jobber' && view === 'overview' ? <p className="hero-kicker jobber-kicker">Jobber operations</p> : null}
                {source === 'internal' ? <p className="hero-kicker">Admin internal</p> : null}
                {source === 'pricing' ? <p className="hero-kicker pricing-kicker">Pricing calculator</p> : null}
                <h2>{title}</h2>
                <p className="muted">
                  {source === 'master'
                    ? MASTER_SUBTITLES[view]
                    : source === 'financials'
                    ? FINANCIALS_SUBTITLES[view]
                    : view === 'overview'
                    ? source === 'jobber'
                      ? 'Click any number or chart to see the work behind it.'
                      : source === 'internal'
                        ? 'Live snapshot from your database after sync.'
                        : 'Quotes and catalog synced from Pricing Calculator.'
                    : JOBBER_BOARD_VIEWS.has(view)
                      ? 'Live board from Jobber operations.'
                      : view === 'mappings'
                        ? 'Edit service type and division classification rules.'
                        : view === 'mrr'
                          ? 'New MRR gained vs MRR lost.'
                          : `${number(list?.count || 0)} records`}
                </p>
              </div>
              <div className="hero-tools">
                {filterOptions?.divisions?.length && (view === 'overview' || JOBBER_BOARD_VIEWS.has(view)) ? (
                  <label className="division-filter">
                    <span>Division</span>
                    <select value={filters.division || ''} onChange={(e) => setFilter('division', e.target.value)}>
                      <option value="">All divisions</option>
                      {uniqueDivisions(filterOptions.divisions).map((item) => (
                        <option key={item.key || item} value={item.key || item}>
                          {item.label || item}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {source !== 'jobber' && view === 'overview' && updatedAt ? (
                  <div className="hero-meta">
                    <span className="meta-pill">Last sync</span>
                    <strong>{relative(updatedAt)}</strong>
                  </div>
                ) : null}
              </div>
            </section>

            {showInternalEmpty ? (
              <article className="card internal-empty">
                <p className="hero-kicker">Get started</p>
                <h3>No internal data yet</h3>
                <p className="muted">Pull analytics from the admin internal app, store it locally, then browse it here.</p>
                <button className="primary" type="button" onClick={refresh} disabled={busy || syncing}>
                  Sync Internal App
                </button>
              </article>
            ) : null}

            {showPricingEmpty ? (
              <article className="card internal-empty pricing-empty">
                <p className="hero-kicker pricing-kicker">Get started</p>
                <h3>No pricing data yet</h3>
                <p className="muted">Pull quotes and catalog from Pricing Calculator, store them locally, then explore here.</p>
                <button className="primary" type="button" onClick={refresh} disabled={busy || syncing}>
                  Sync Pricing Calculator
                </button>
              </article>
            ) : null}

            {!showInternalEmpty && !showPricingEmpty ? (
              <PeriodProvider>
                <Outlet />
              </PeriodProvider>
            ) : null}
          </main>
        </div>
      ) : null}

      {detail ? (
        detail.kind === 'pricing' ? (
          <PricingDrawer payload={detail} onBack={goBack} />
        ) : (
          <Drawer payload={detail} onBack={goBack} onOpen={openDetail} />
        )
      ) : null}
    </div>
  )
}

export function DashboardLayout() {
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  )
}
