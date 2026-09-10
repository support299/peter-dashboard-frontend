import { Outlet } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { ProfileMenu, SideNav, SourceToggle } from '../../components/layout'
import { JOBBER_BOARD_VIEWS } from '../../config/navigation'
import { API, number, relative, uniqueDivisions } from '../../lib'
import { ChangePasswordModal } from '../auth'
import { Drawer } from '../jobber'
import { PricingDrawer } from '../pricing'
import { DashboardProvider, useDashboard } from './DashboardProvider'
import '../../styles/App.css'

function DashboardShell() {
  const {
    source,
    view,
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

  if (!ready) {
    return <div className="content muted">Loading…</div>
  }

  const layoutClass =
    source === 'internal' ? 'layout internal' : source === 'pricing' ? 'layout pricing' : source === 'jobber' ? 'layout jobber' : 'layout'

  return (
    <div className="app">
      {showChangePassword ? (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      ) : null}
      <header className="topbar">
        <div className="brand">
          <div className="mark">P</div>
          <div>
            <h1>Peter</h1>
            <p>
              {source === 'jobber'
                ? jobber?.account_name || 'Jobber'
                : source === 'internal'
                  ? 'Contractor Hub'
                  : 'Pricing Calculator'}
            </p>
          </div>
        </div>

        <SourceToggle source={source} onChange={switchSource} />

        <div className="topbar-actions">
          <span className="hint">
            {syncing ? 'Updating…' : updatedAt ? `Updated ${relative(updatedAt)}` : 'Not synced yet'}
          </span>
          <button
            className="ghost"
            type="button"
            onClick={refresh}
            disabled={busy || syncing || (source === 'jobber' && !connected)}
          >
            {syncing ? 'Refreshing…' : source === 'jobber' ? 'Refresh' : source === 'internal' ? 'Sync Internal' : 'Sync Pricing'}
          </button>
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
          <SideNav source={source} items={nav} view={view} onOpen={openView} />

          <main className="content">
            {error ? <div className="notice">{error}</div> : null}

            <section className={`hero ${source !== 'jobber' ? 'hero-internal' : ''}`}>
              <div>
                {view !== 'overview' || detail ? (
                  <button className="back" type="button" onClick={goBack}>
                    ← Back
                  </button>
                ) : null}
                {source === 'jobber' && view === 'overview' ? <p className="hero-kicker jobber-kicker">Jobber operations</p> : null}
                {source === 'internal' ? <p className="hero-kicker">Admin internal</p> : null}
                {source === 'pricing' ? <p className="hero-kicker pricing-kicker">Pricing calculator</p> : null}
                <h2>{title}</h2>
                <p className="muted">
                  {view === 'overview'
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

            {!showInternalEmpty && !showPricingEmpty ? <Outlet /> : null}
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
