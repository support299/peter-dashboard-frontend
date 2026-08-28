import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AreaChart, ColumnChart, Donut, INTERNAL_COLORS, JOBBER_COLORS, RankBars, SegmentedBar } from './charts'
import { API, api, money, number, queryString, readJson, relative, when } from './lib'

const JOBBER_NAV = [
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

const JOBBER_BOARD_VIEWS = new Set(['oneoff', 'cancellations', 'cx'])
const JOBBER_SPECIAL_VIEWS = new Set(['oneoff', 'cancellations', 'cx', 'mappings'])

const INTERNAL_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'employees', label: 'Employees', icon: 'employees' },
  { id: 'leave', label: 'Leave', icon: 'leave' },
  { id: 'bonuses', label: 'Bonuses', icon: 'bonuses' },
  { id: 'lockins', label: 'Lock-ins', icon: 'lockins' },
  { id: 'visits', label: 'Visits', icon: 'visits' },
]

const PRICING_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'submissions', label: 'Quotes', icon: 'quotes' },
  { id: 'services', label: 'Services', icon: 'services' },
  { id: 'packages', label: 'Packages', icon: 'packages' },
  { id: 'locations', label: 'Locations', icon: 'locations' },
  { id: 'coupons', label: 'Coupons', icon: 'coupons' },
  { id: 'addons', label: 'Add-ons', icon: 'addons' },
]

const SOURCE_SIDEBAR = {
  jobber: { title: 'Jobber', subtitle: 'Operations', tone: 'teal' },
  internal: { title: 'Internal', subtitle: 'Contractor hub', tone: 'teal' },
  pricing: { title: 'Pricing', subtitle: 'Quote engine', tone: 'cyan' },
}

const JOBBER_LIST_PATH = {
  visits: '/api/operations/visits/',
  jobs: '/api/operations/jobs/',
  clients: '/api/operations/clients/',
  invoices: '/api/operations/invoices/',
}

const INTERNAL_LIST_PATH = {
  employees: '/api/admin-internal/employees/',
  leave: '/api/admin-internal/leave/',
  bonuses: '/api/admin-internal/bonuses/',
  lockins: '/api/admin-internal/lockins/',
  visits: '/api/admin-internal/visits/',
}

const PRICING_LIST_PATH = {
  submissions: '/api/pricing-calculator/submissions/',
  services: '/api/pricing-calculator/services/',
  packages: '/api/pricing-calculator/packages/',
  locations: '/api/pricing-calculator/locations/',
  coupons: '/api/pricing-calculator/coupons/',
  addons: '/api/pricing-calculator/addons/',
}

function SourceToggle({ source, onChange }) {
  return (
    <div className="source-toggle" role="tablist" aria-label="Dashboard source">
      <button type="button" role="tab" aria-selected={source === 'jobber'} className={source === 'jobber' ? 'active' : ''} onClick={() => onChange('jobber')}>
        Jobber
      </button>
      <button type="button" role="tab" aria-selected={source === 'internal'} className={source === 'internal' ? 'active' : ''} onClick={() => onChange('internal')}>
        Internal App
      </button>
      <button type="button" role="tab" aria-selected={source === 'pricing'} className={source === 'pricing' ? 'active' : ''} onClick={() => onChange('pricing')}>
        Pricing
      </button>
    </div>
  )
}

function NavIcon({ name }) {
  switch (name) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      )
    case 'visits':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3h8v3H8zM5 6h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" />
          <path d="M8 11h8M8 15h5" />
        </svg>
      )
    case 'jobs':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <rect x="3" y="7" width="18" height="13" rx="2" />
        </svg>
      )
    case 'clients':
    case 'employees':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19c1.8-3.8 4.2-5.5 7-5.5s5.2 1.7 7 5.5" />
        </svg>
      )
    case 'invoices':
    case 'quotes':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M15 3v4h4M8 12h8M8 16h6" />
        </svg>
      )
    case 'leave':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4" />
        </svg>
      )
    case 'bonuses':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M9.5 10.5h5M9.5 13.5h5" />
        </svg>
      )
    case 'lockins':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      )
    case 'services':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16v12H4z" />
          <path d="M8 7V5h8v2M8 12h8M8 16h5" />
        </svg>
      )
    case 'packages':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 8l9-4 9 4-9 4-9-4z" />
          <path d="M3 8v8l9 4 9-4V8" />
          <path d="M12 12v8" />
        </svg>
      )
    case 'locations':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    case 'coupons':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9a2.5 2.5 0 0 0 0 5v2.5A1.5 1.5 0 0 0 4.5 18h15a1.5 1.5 0 0 0 1.5-1.5V14a2.5 2.5 0 0 0 0-5V7.5A1.5 1.5 0 0 0 19.5 6h-15A1.5 1.5 0 0 0 3 7.5V9z" />
          <path d="M14 8v8" />
        </svg>
      )
    case 'addons':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )
    case 'oneoff':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h11l5 5v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
          <path d="M14 7v5h5M8 13h4M8 16h6" />
        </svg>
      )
    case 'cancellations':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      )
    case 'cx':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l2.2 4.5L19 8.5l-3.5 3.4.8 4.8L12 14.8 7.7 16.7l.8-4.8L5 8.5l4.8-1L12 3z" />
        </svg>
      )
    case 'mappings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="8" cy="6" r="1.6" />
          <circle cx="14" cy="12" r="1.6" />
          <circle cx="10" cy="18" r="1.6" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
        </svg>
      )
  }
}

function SideNav({ source, items, view, onOpen }) {
  const meta = SOURCE_SIDEBAR[source] || SOURCE_SIDEBAR.jobber
  return (
    <aside className={`side-nav tone-${meta.tone}`}>
      <div className="side-nav-brand anim-rise" style={{ '--delay': '40ms' }}>
        <div className="side-nav-mark">{meta.title.slice(0, 1)}</div>
        <div>
          <strong>{meta.title}</strong>
          <span>{meta.subtitle}</span>
        </div>
      </div>
      <p className="side-nav-label anim-rise" style={{ '--delay': '90ms' }}>
        Navigate
      </p>
      <nav className="nav" aria-label={`${meta.title} sections`}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`side-nav-item anim-rise${view === item.id ? ' active' : ''}`}
            style={{ '--delay': `${120 + index * 45}ms` }}
            onClick={() => onOpen(item.id, {}, { remember: false })}
          >
            <span className="side-nav-icon">
              <NavIcon name={item.icon || item.id} />
            </span>
            <span className="side-nav-text">{item.label}</span>
            {view === item.id ? <span className="side-nav-pip" /> : null}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function App() {
  const [source, setSource] = useState('jobber')
  const [jobber, setJobber] = useState(null)
  const [internal, setInternal] = useState(null)
  const [pricing, setPricing] = useState(null)
  const [dash, setDash] = useState(null)
  const [board, setBoard] = useState(null)
  const [view, setView] = useState('overview')
  const [filters, setFilters] = useState({})
  const [filterOptions, setFilterOptions] = useState(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [list, setList] = useState(null)
  const [detail, setDetail] = useState(null)
  const [trail, setTrail] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const connected = Boolean(jobber?.connected)
  const syncing =
    source === 'jobber'
      ? ['queued', 'running', 'syncing'].includes(jobber?.sync?.status) || jobber?.status === 'syncing'
      : source === 'internal'
        ? ['queued', 'running'].includes(internal?.sync?.status)
        : ['queued', 'running'].includes(pricing?.sync?.status)

  async function loadJobberStatus() {
    const payload = await readJson(await api('/api/jobber/status/'))
    setJobber(payload.jobber)
    return payload.jobber
  }

  async function loadInternalStatus() {
    const payload = await readJson(await api('/api/admin-internal/status/'))
    setInternal(payload)
    return payload
  }

  async function loadPricingStatus() {
    const payload = await readJson(await api('/api/pricing-calculator/status/'))
    setPricing(payload)
    return payload
  }

  async function loadJobberDash(nextFilters = filters) {
    const payload = await readJson(
      await api(`/api/operations/dashboard/${queryString({ division: nextFilters.division })}`),
    )
    setDash(payload)
  }

  async function loadInternalDash() {
    const payload = await readJson(await api('/api/admin-internal/dashboard/'))
    setDash(payload)
  }

  async function loadPricingDash() {
    const payload = await readJson(await api('/api/pricing-calculator/dashboard/'))
    setDash(payload)
  }

  async function loadJobberBoard(nextView = view, nextFilters = filters) {
    const paths = {
      oneoff: '/api/operations/one-off/',
      cancellations: '/api/operations/cancellations/dashboard/',
      cx: '/api/operations/cx/',
    }
    const path = paths[nextView]
    if (!path) return
    const payload = await readJson(
      await api(
        `${path}${queryString({
          division: nextFilters.division,
          from: nextFilters.from,
          to: nextFilters.to,
          service_type: nextFilters.service_type,
          type: nextFilters.type,
        })}`,
      ),
    )
    setBoard(payload)
  }

  async function loadFilterOptions() {
    if (source === 'jobber') {
      setFilterOptions(await readJson(await api('/api/operations/filters/')))
    } else if (source === 'internal') {
      const [internalOpts, jobberOpts] = await Promise.all([
        readJson(await api('/api/admin-internal/filters/')),
        readJson(await api('/api/operations/filters/')).catch(() => ({})),
      ])
      setFilterOptions({ ...internalOpts, divisions: jobberOpts.divisions || [] })
    } else if (source === 'pricing') {
      const [pricingOpts, jobberOpts] = await Promise.all([
        readJson(await api('/api/pricing-calculator/filters/')),
        readJson(await api('/api/operations/filters/')).catch(() => ({})),
      ])
      setFilterOptions({ ...pricingOpts, divisions: jobberOpts.divisions || [] })
    }
  }

  async function loadList(nextView = view, nextFilters = filters, page = 1) {
    const paths = source === 'jobber' ? JOBBER_LIST_PATH : source === 'internal' ? INTERNAL_LIST_PATH : PRICING_LIST_PATH
    const path = paths[nextView]
    if (!path) return
    const payload = await readJson(await api(`${path}${queryString({ ...nextFilters, page, q: query })}`))
    setList(payload)
  }

  async function openDetail(kind, id) {
    if (source === 'jobber') {
      setTrail((items) => [...items, { view, filters, search, detail }])
      const payload = await readJson(await api(`/api/operations/${kind}/${id}/`))
      setDetail(payload)
      return
    }
    if (source === 'pricing' && kind === 'submissions') {
      setTrail((items) => [...items, { view, filters, search, detail }])
      const payload = await readJson(await api(`/api/pricing-calculator/submissions/${id}/`))
      setDetail({ kind: 'pricing', ...payload })
    }
  }

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        await Promise.all([loadJobberStatus(), loadInternalStatus(), loadPricingStatus()])
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setDash(null)
      setBoard(null)
      setList(null)
      setDetail(null)
      setTrail([])
      setView('overview')
      setFilters({})
      setSearch('')
      setQuery('')
      setFilterOptions(null)
      try {
        if (source === 'jobber') {
          const state = await loadJobberStatus()
          if (!cancelled && state?.connected) {
            await loadJobberDash({})
            await loadFilterOptions()
          }
        } else if (source === 'internal') {
          const state = await loadInternalStatus()
          if (!cancelled && state?.has_data) {
            await loadInternalDash()
            await loadFilterOptions()
          } else if (!cancelled) {
            await loadFilterOptions()
          }
        } else {
          const state = await loadPricingStatus()
          if (!cancelled && state?.has_data) {
            await loadPricingDash()
            await loadFilterOptions()
          } else if (!cancelled) {
            await loadFilterOptions()
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [source])

  useEffect(() => {
    if (!syncing) return undefined
    const timer = setInterval(async () => {
      try {
        if (source === 'jobber') {
          const state = await loadJobberStatus()
          if (state?.sync?.status === 'success') await loadJobberDash()
        } else if (source === 'internal') {
          const state = await loadInternalStatus()
          if (state?.sync?.status === 'success') {
            await loadInternalDash()
            await loadFilterOptions()
          }
        } else {
          const state = await loadPricingStatus()
          if (state?.sync?.status === 'success') {
            await loadPricingDash()
            await loadFilterOptions()
          }
        }
      } catch (err) {
        setError(err.message)
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [syncing, source])

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (source !== 'jobber' || !connected || view !== 'overview') return
    loadJobberDash(filters).catch((err) => setError(err.message))
  }, [source, connected, view, filters.division])

  useEffect(() => {
    if (view === 'overview') return
    if (source === 'jobber' && !connected) return
    if (source === 'jobber' && JOBBER_BOARD_VIEWS.has(view)) {
      setList(null)
      loadJobberBoard(view, filters).catch((err) => setError(err.message))
      return
    }
    if (source === 'jobber' && view === 'mappings') {
      setList(null)
      setBoard(null)
      return
    }
    loadList(view, filters, 1).catch((err) => setError(err.message))
  }, [source, connected, view, filters, query])

  async function refresh() {
    setBusy(true)
    setError('')
    try {
      if (source === 'jobber') {
        const payload = await readJson(await fetch(`${API}/api/jobber/sync/`, { method: 'POST' }))
        setJobber(payload.jobber)
      } else if (source === 'internal') {
        const payload = await readJson(await fetch(`${API}/api/admin-internal/sync/`, { method: 'POST' }))
        setInternal((prev) => ({
          ...(prev || {}),
          sync: payload.sync,
          last_success: payload.sync,
          has_data: true,
        }))
        await loadInternalDash()
        await loadFilterOptions()
        if (view !== 'overview') await loadList(view, filters, 1)
      } else {
        const payload = await readJson(await fetch(`${API}/api/pricing-calculator/sync/`, { method: 'POST' }))
        setPricing((prev) => ({
          ...(prev || {}),
          sync: payload.sync,
          last_success: payload.sync,
          has_data: true,
        }))
        await loadPricingDash()
        await loadFilterOptions()
        if (view !== 'overview') await loadList(view, filters, 1)
      }
    } catch (err) {
      setError(err.message === 'A sync is already running.' ? 'Refresh already running.' : err.message || 'Could not refresh right now.')
    } finally {
      setBusy(false)
    }
  }

  function switchSource(next) {
    if (next === source) return
    setSource(next)
  }

  function openView(next, nextFilters = {}, { remember } = { remember: true }) {
    if (remember) {
      setTrail((items) => [...items, { view, filters, search, detail }])
    } else {
      setTrail([])
    }
    setView(next)
    setFilters((prev) => {
      const nextMap = { ...nextFilters }
      if (nextMap.division === undefined && prev.division) nextMap.division = prev.division
      return nextMap
    })
    setSearch('')
    setList(null)
    setBoard(null)
    setDetail(null)
  }

  function goBack() {
    const prev = trail.at(-1)
    setTrail((items) => items.slice(0, -1))
    if (!prev) {
      setDetail(null)
      setView('overview')
      setFilters({})
      setSearch('')
      return
    }
    setView(prev.view)
    setFilters(prev.filters || {})
    setSearch(prev.search || '')
    setDetail(prev.detail || null)
  }

  function setFilter(key, value) {
    setFilters((prev) => {
      const next = { ...prev }
      if (value === '' || value == null) delete next[key]
      else next[key] = value
      return next
    })
  }

  const nav = source === 'jobber' ? JOBBER_NAV : source === 'internal' ? INTERNAL_NAV : PRICING_NAV
  const title = useMemo(() => {
    if (view === 'overview') {
      if (source === 'jobber') return jobber?.account_name || 'Jobber'
      if (source === 'internal') return 'Internal App'
      return 'Pricing Calculator'
    }
    return nav.find((item) => item.id === view)?.label
  }, [view, jobber, source, nav])

  const updatedAt =
    source === 'jobber'
      ? jobber?.last_synced_at
      : source === 'internal'
        ? internal?.last_success?.finished_at || internal?.sync?.finished_at
        : pricing?.last_success?.finished_at || pricing?.sync?.finished_at

  if (!jobber && !internal && !pricing) {
    return <div className="content muted">Loading…</div>
  }

  const showJobberConnect = source === 'jobber' && jobber && !connected
  const showInternalEmpty = source === 'internal' && internal && !internal.has_data && !dash
  const showPricingEmpty = source === 'pricing' && pricing && !pricing.has_data && !dash
  const layoutClass =
    source === 'internal' ? 'layout internal' : source === 'pricing' ? 'layout pricing' : source === 'jobber' ? 'layout jobber' : 'layout'

  return (
    <div className="app">
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
                        : `${number(list?.count || 0)} records`}
                </p>
              </div>
              <div className="hero-tools">
                {filterOptions?.divisions?.length ? (
                  <label className="division-filter">
                    <span>Division</span>
                    <select
                      value={filters.division || ''}
                      onChange={(e) => setFilter('division', e.target.value)}
                    >
                      <option value="">All divisions</option>
                      {filterOptions.divisions.map((item) => (
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

            {source === 'jobber' && view === 'overview' && dash?.charts?.revenue ? (
              <Overview dash={dash} onKpi={openView} onDetail={openDetail} />
            ) : null}

            {source === 'jobber' && view === 'oneoff' ? (
              <OneOffBoard dash={board} onKpi={openView} />
            ) : null}

            {source === 'jobber' && view === 'cancellations' ? (
              <CancellationsBoard dash={board} onKpi={openView} />
            ) : null}

            {source === 'jobber' && view === 'cx' ? <CxBoard dash={board} /> : null}

            {source === 'jobber' && view === 'mappings' ? <MappingsView /> : null}

            {source === 'internal' && view === 'overview' && dash?.kpis ? (
              <InternalOverview dash={dash} onKpi={openView} />
            ) : null}

            {source === 'pricing' && view === 'overview' && dash?.kpis ? (
              <PricingOverview dash={dash} onKpi={openView} onOpen={openDetail} />
            ) : null}

            {view !== 'overview' &&
            !JOBBER_SPECIAL_VIEWS.has(view) &&
            !showInternalEmpty &&
            !showPricingEmpty ? (
              source === 'jobber' ? (
                <ListView
                  view={view}
                  list={list}
                  search={search}
                  setSearch={setSearch}
                  filters={filters}
                  setFilter={setFilter}
                  filterOptions={filterOptions}
                  onPage={(page) => loadList(view, filters, page)}
                  onOpen={openDetail}
                />
              ) : source === 'internal' ? (
                <InternalListView
                  view={view}
                  list={list}
                  search={search}
                  setSearch={setSearch}
                  filters={filters}
                  setFilter={setFilter}
                  filterOptions={filterOptions}
                  onPage={(page) => loadList(view, filters, page)}
                />
              ) : (
                <PricingListView
                  view={view}
                  list={list}
                  search={search}
                  setSearch={setSearch}
                  filters={filters}
                  setFilter={setFilter}
                  filterOptions={filterOptions}
                  onPage={(page) => loadList(view, filters, page)}
                  onOpen={openDetail}
                />
              )
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

function formatKpi(kpi) {
  if (kpi.kind === 'currency') return money(kpi.value)
  if (kpi.kind === 'percent') return `${number(kpi.value)}%`
  return number(kpi.value)
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function AnimatedMetric({ kpi, delay = 0 }) {
  const reduced = usePrefersReducedMotion()
  const target = Number(kpi.value || 0)
  const [shown, setShown] = useState(reduced ? target : 0)

  useEffect(() => {
    if (reduced) {
      setShown(target)
      return undefined
    }
    let frame = 0
    const start = performance.now()
    const duration = 700
    const from = 0
    const tick = (now) => {
      const progress = Math.min(1, (now - start - delay) / duration)
      if (progress <= 0) {
        frame = requestAnimationFrame(tick)
        return
      }
      const eased = 1 - (1 - progress) ** 3
      setShown(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, delay, reduced])

  const display =
    kpi.kind === 'currency'
      ? money(shown)
      : kpi.kind === 'percent'
        ? `${number(Math.round(shown * 10) / 10)}%`
        : number(Math.round(shown))

  return <strong className="metric-value">{display}</strong>
}

function Overview({ dash, onKpi, onDetail }) {
  const kpis = dash.kpis || []
  const hero = kpis.find((kpi) => kpi.key === 'revenue')
  const outstanding = kpis.find((kpi) => kpi.key === 'outstanding')
  const clients = kpis.find((kpi) => kpi.key === 'clients')
  const visits = kpis.find((kpi) => kpi.key === 'visits')
  const topStats = [outstanding, clients, visits].filter(Boolean)
  const opsKeys = ['cancelled', 'cancelled_jobs', 'one_off', 'recurring', 'first_cleans', 'deep_cleans', 'new_recurring', 'avg_price']
  const ops = opsKeys.map((key) => kpis.find((kpi) => kpi.key === key)).filter(Boolean)
  const used = new Set(['revenue', 'outstanding', 'clients', 'visits', ...opsKeys])
  const rest = kpis.filter((kpi) => !used.has(kpi.key))

  const invoiceRows = (dash.charts?.invoices || []).map((row) => ({
    ...row,
    value: row.count,
    revenue: row.amount,
  }))

  return (
    <div className="jobber-board">
      <section className="jobber-top-grid">
        {hero ? (
          <button
            type="button"
            className="jobber-hero-card anim-rise"
            style={{ '--delay': '40ms' }}
            onClick={() => onKpi(hero.view, hero.filters || {})}
          >
            <div className="jobber-hero-main">
              <div className="jobber-hero-icon-wrap">
                <RevenueIcon />
              </div>
              <div>
                <span className="jobber-eyebrow">Invoice revenue</span>
                <AnimatedMetric kpi={hero} delay={40} />
                <p>{JOBBER_KPI_META.revenue.hint}</p>
              </div>
            </div>
            <JobberSpark data={dash.charts?.revenue || []} />
          </button>
        ) : null}

        {topStats.map((kpi, index) => {
          const meta = JOBBER_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
          const Icon = JOBBER_TOP_ICONS[kpi.key]
          return (
            <button
              key={kpi.key}
              type="button"
              className={`jobber-stat tone-${meta.tone} anim-rise`}
              style={{ '--delay': `${120 + index * 70}ms` }}
              onClick={() => onKpi(kpi.view, kpi.filters || {})}
            >
              <div className="jobber-stat-top">
                <span>{kpi.label}</span>
                {Icon ? (
                  <span className={`jobber-icon-wrap ${kpi.key}`}>
                    <Icon />
                  </span>
                ) : null}
              </div>
              <AnimatedMetric kpi={kpi} delay={120 + index * 70} />
              <em>{meta.hint}</em>
            </button>
          )
        })}
      </section>

      {ops.length ? (
        <section className="jobber-strip ops-strip">
          {ops.map((kpi, index) => {
            const meta = JOBBER_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
            const Icon = JOBBER_STRIP_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`jobber-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${280 + index * 50}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="jobber-stat-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`jobber-icon-wrap strip ${kpi.key}`}>
                      <Icon />
                    </span>
                  ) : null}
                </div>
                <AnimatedMetric kpi={kpi} delay={280 + index * 50} />
              </button>
            )
          })}
        </section>
      ) : null}

      {rest.length ? (
        <section className="jobber-strip">
          {rest.map((kpi, index) => {
            const meta = JOBBER_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
            const Icon = JOBBER_STRIP_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`jobber-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${520 + index * 40}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="jobber-stat-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`jobber-icon-wrap strip ${kpi.key}`}>
                      <Icon />
                    </span>
                  ) : null}
                </div>
                <AnimatedMetric kpi={kpi} delay={520 + index * 40} />
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="jobber-bento">
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '420ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Revenue by month</h3>
              <p>Invoice totals · click a month to filter</p>
            </div>
          </header>
          <AreaChart
            valueLabel="Revenue"
            data={dash.charts?.revenue || []}
            onSelect={(point) => {
              if (!point.month) return
              const [year, month] = point.month.split('-').map(Number)
              const start = `${point.month}-01`
              const endDate = new Date(year, month, 1)
              onKpi('invoices', { from: start, to: endDate.toISOString().slice(0, 10) })
            }}
          />
        </article>

        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '500ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Visit mix</h3>
              <p>Recurring vs one-off and more</p>
            </div>
          </header>
          <SegmentedBar
            colors={JOBBER_COLORS}
            data={dash.charts?.mix || []}
            onSelect={(item) => onKpi('visits', { type: item.key })}
          />
        </article>

        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '580ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Visits by month</h3>
              <p>Volume trend · click a month to open visits</p>
            </div>
          </header>
          <AreaChart
            color="#2563eb"
            valueLabel="Visits"
            data={dash.charts?.visits || []}
            onSelect={(point) => {
              if (!point.month) return
              const [year, month] = point.month.split('-').map(Number)
              const start = `${point.month}-01`
              const endDate = new Date(year, month, 1)
              onKpi('visits', { from: start, to: endDate.toISOString().slice(0, 10) })
            }}
          />
        </article>

        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '660ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Invoices</h3>
              <p>Status mix · pie view</p>
            </div>
          </header>
          <Donut
            data={invoiceRows}
            onSelect={(item) => onKpi('invoices', { status: item.key })}
          />
        </article>

        <article className="jobber-panel span-12 list-panel anim-rise" style={{ '--delay': '740ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Recent visits</h3>
              <p>Latest work from Jobber</p>
            </div>
            <button className="ghost tiny" type="button" onClick={() => onKpi('visits', {})}>
              View all
            </button>
          </header>
          <VisitTable rows={dash.recent_visits || []} onOpen={(id) => onDetail('visits', id)} />
        </article>
      </section>
    </div>
  )
}

const JOBBER_KPI_META = {
  revenue: { tone: 'teal', hint: 'All invoice totals' },
  outstanding: { tone: 'amber', hint: 'Still unpaid' },
  clients: { tone: 'blue', hint: 'Active customers' },
  jobs: { tone: 'slate', hint: 'Open + closed' },
  visits: { tone: 'teal', hint: 'This month' },
  visits_total: { tone: 'blue', hint: 'All visits' },
  completed: { tone: 'blue', hint: 'Marked complete' },
  cancelled: { tone: 'amber', hint: 'Cancelled Visit tasks' },
  cancelled_jobs: { tone: 'amber', hint: 'Cancelled Job tasks' },
  one_off: { tone: 'teal', hint: 'One-off jobs' },
  recurring: { tone: 'blue', hint: 'Recurring visits' },
  first_cleans: { tone: 'slate', hint: 'First cleans' },
  deep_cleans: { tone: 'slate', hint: 'Deep cleans' },
  new_recurring: { tone: 'teal', hint: 'New recurring jobs' },
  avg_price: { tone: 'amber', hint: 'Avg price / visit' },
}

function RevenueIcon() {
  return (
    <svg className="jobber-hero-icon" viewBox="0 0 56 56" aria-hidden="true">
      <circle className="jh-ring" cx="28" cy="28" r="24" />
      <circle className="jh-coin" cx="28" cy="28" r="16" />
      <path className="jh-mark" d="M28 18v2.4c3 .3 5.2 1.9 5.2 4.5 0 2.8-2.3 4.1-5.6 4.7l-1.5.3c-1.8.3-2.7.9-2.7 2s1.1 1.9 2.8 1.9c2 0 3.2-.8 3.7-2l2.5 1.3c-1 2.2-3.2 3.5-5.9 3.8V40h-2.8v-2.3c-3.1-.3-5.4-2.1-5.4-4.8 0-3 2.4-4.4 5.8-5l1.5-.3c1.7-.3 2.5-.9 2.5-1.9s-.9-1.6-2.5-1.6c-1.6 0-2.7.7-3.2 1.8l-2.5-1.3c1-2.1 3.2-3.4 5.8-3.7V18H28z" />
    </svg>
  )
}

function OutstandingIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="js-bg outstanding" x="8" y="10" width="24" height="20" rx="5" />
      <path className="js-mark" d="M14 17h12M14 22h8" />
      <circle className="js-dot" cx="28" cy="14" r="2.5" />
    </svg>
  )
}

function ClientsIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg clients" cx="20" cy="15" r="6" />
      <path className="js-mark" d="M10 30c2.2-6 6-8.5 10-8.5S27.8 24 30 30" />
    </svg>
  )
}

function MonthVisitsIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="js-bg visits" x="9" y="10" width="22" height="20" rx="4" />
      <path className="js-mark" d="M9 16h22M15 10v4M25 10v4" />
      <circle className="js-dot" cx="16" cy="23" r="1.8" />
      <circle className="js-dot" cx="20" cy="23" r="1.8" />
      <circle className="js-dot" cx="24" cy="23" r="1.8" />
    </svg>
  )
}

function JobsIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="js-bg jobs" x="8" y="14" width="24" height="16" rx="3" />
      <path className="js-mark" d="M15 14v-2a5 5 0 0 1 10 0v2" />
    </svg>
  )
}

function CompletedIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg completed" cx="20" cy="20" r="12" />
      <path className="js-mark" d="M13 20l4.5 4.5L27 15" />
    </svg>
  )
}

function CancelledIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg cancelled" cx="20" cy="20" r="12" />
      <path className="js-mark" d="M14 14l12 12M26 14L14 26" />
    </svg>
  )
}

function OneOffIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="js-bg oneoff" x="8" y="11" width="24" height="18" rx="4" />
      <path className="js-mark" d="M14 18h12M14 23h8" />
    </svg>
  )
}

function RecurringIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <path className="js-bg recurring" d="M12 18a8 8 0 0 1 14-4" />
      <path className="js-mark" d="M26 10v4h-4M28 22a8 8 0 0 1-14 4M14 30v-4h4" />
    </svg>
  )
}

function AvgPriceIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg avg" cx="20" cy="20" r="12" />
      <path className="js-mark" d="M20 14v12M16 18h6c1.7 0 3 1 3 2.5S23.7 23 22 23h-6" />
    </svg>
  )
}

const JOBBER_TOP_ICONS = {
  outstanding: OutstandingIcon,
  clients: ClientsIcon,
  visits: MonthVisitsIcon,
}

const JOBBER_STRIP_ICONS = {
  jobs: JobsIcon,
  completed: CompletedIcon,
  visits_total: MonthVisitsIcon,
  cancelled: CancelledIcon,
  cancelled_jobs: CancelledIcon,
  one_off: OneOffIcon,
  recurring: RecurringIcon,
  first_cleans: CompletedIcon,
  deep_cleans: JobsIcon,
  new_recurring: RecurringIcon,
  avg_price: AvgPriceIcon,
}

function JobberSpark({ data = [] }) {
  const values = data.map((item) => Number(item.value || 0))
  if (!values.length) return <div className="jobber-spark empty" />
  const max = Math.max(...values, 1)
  const width = 160
  const height = 48
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = height - (value / max) * (height - 8) - 4
      return `${x},${y}`
    })
    .join(' ')
  const area = `0,${height} ${points} ${width},${height}`
  return (
    <svg className="jobber-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline className="jobber-spark-area" points={area} />
      <polyline className="jobber-spark-line" points={points} />
    </svg>
  )
}

function BoardKpiStrip({ kpis = [], onKpi }) {
  if (!kpis.length) return null
  return (
    <section className="jobber-strip ops-strip">
      {kpis.map((kpi, index) => {
        const meta = JOBBER_KPI_META[kpi.key] || { tone: 'teal', hint: '' }
        return (
          <button
            key={kpi.key}
            type="button"
            className={`jobber-strip-card tone-${meta.tone} anim-rise`}
            style={{ '--delay': `${80 + index * 50}ms` }}
            onClick={() => (onKpi && kpi.view ? onKpi(kpi.view, kpi.filters || {}) : undefined)}
          >
            <div className="jobber-stat-top">
              <span>{kpi.label}</span>
            </div>
            <AnimatedMetric kpi={kpi} delay={80 + index * 50} />
          </button>
        )
      })}
    </section>
  )
}

function OneOffBoard({ dash, onKpi }) {
  if (!dash) return <p className="empty muted">Loading…</p>
  return (
    <div className="jobber-board">
      <BoardKpiStrip kpis={dash.kpis || []} onKpi={onKpi} />
      <section className="jobber-bento">
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '180ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>By service type</h3>
              <p>Job count mix</p>
            </div>
          </header>
          <SegmentedBar colors={JOBBER_COLORS} data={dash.charts?.by_type || dash.by_service_type || []} />
        </article>
        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '240ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Revenue by type</h3>
              <p>Ranked one-off revenue</p>
            </div>
          </header>
          <RankBars valueLabel="Revenue" data={dash.charts?.revenue_by_type || []} />
        </article>
        <article className="jobber-panel span-12 anim-rise" style={{ '--delay': '300ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Service type breakdown</h3>
              <p>Count, revenue, and average price</p>
            </div>
          </header>
          <table className="table">
            <thead>
              <tr>
                <th>Service type</th>
                <th>Jobs</th>
                <th>Revenue</th>
                <th>Avg price</th>
              </tr>
            </thead>
            <tbody>
              {(dash.by_service_type || []).map((row) => (
                <tr key={row.key || row.label}>
                  <td>{row.label}</td>
                  <td>{number(row.count ?? row.value)}</td>
                  <td>{money(row.revenue)}</td>
                  <td>{money(row.avg_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  )
}

function CancellationsBoard({ dash, onKpi }) {
  if (!dash) return <p className="empty muted">Loading…</p>
  return (
    <div className="jobber-board">
      <BoardKpiStrip kpis={dash.kpis || []} onKpi={onKpi} />
      <section className="jobber-bento">
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '180ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Cancelled visits by month</h3>
              <p>Value trend</p>
            </div>
          </header>
          <AreaChart color="#d97706" valueLabel="Value" data={dash.charts?.visits_by_month || []} />
        </article>
        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '240ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Visits by division</h3>
              <p>Cancelled visit mix</p>
            </div>
          </header>
          <SegmentedBar colors={JOBBER_COLORS} data={dash.charts?.visits_by_division || []} />
        </article>
        <article className="jobber-panel span-7 anim-rise" style={{ '--delay': '300ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Cancelled jobs by month</h3>
              <p>Lost revenue trend</p>
            </div>
          </header>
          <AreaChart color="#e11d48" valueLabel="Value" data={dash.charts?.jobs_by_month || []} />
        </article>
        <article className="jobber-panel span-5 anim-rise" style={{ '--delay': '360ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Jobs by division</h3>
              <p>Cancelled job mix</p>
            </div>
          </header>
          <RankBars valueLabel="Count" data={dash.charts?.jobs_by_division || []} />
        </article>
        <article className="jobber-panel span-12 list-panel anim-rise" style={{ '--delay': '420ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Recent cancellations</h3>
              <p>Latest cancelled visit and job events</p>
            </div>
          </header>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Division</th>
                <th>Value</th>
                <th>Lost</th>
              </tr>
            </thead>
            <tbody>
              {(dash.recent || []).map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="chip">{row.type}</span>
                  </td>
                  <td>{row.client || '—'}</td>
                  <td>{when(row.task_date)}</td>
                  <td>{row.division || '—'}</td>
                  <td>{money(row.value)}</td>
                  <td>{row.lost_client ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  )
}

function CxBoard({ dash }) {
  if (!dash) return <p className="empty muted">Loading…</p>
  return (
    <div className="jobber-board">
      <BoardKpiStrip kpis={dash.kpis || []} />
      <section className="jobber-bento">
        <article className="jobber-panel span-6 anim-rise" style={{ '--delay': '180ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Recent feedback</h3>
              <p>Customer experience notes</p>
            </div>
          </header>
          <div className="cx-list">
            {(dash.recent_feedback || []).length ? (
              dash.recent_feedback.map((row) => (
                <div className="cx-item" key={row.id}>
                  <div className="cx-item-top">
                    <strong>{row.client || 'Customer'}</strong>
                    <span>{row.rating != null ? `${row.rating}★` : '—'}</span>
                  </div>
                  <p>{row.text || 'No comment'}</p>
                  <span className="hint">
                    {when(row.received_at)} · {row.responded ? 'Responded' : 'Open'}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty muted">No feedback yet.</p>
            )}
          </div>
        </article>
        <article className="jobber-panel span-6 anim-rise" style={{ '--delay': '240ms' }}>
          <header className="jobber-panel-head">
            <div>
              <h3>Google reviews</h3>
              <p>Latest public ratings</p>
            </div>
          </header>
          <div className="cx-list">
            {(dash.recent_reviews || []).length ? (
              dash.recent_reviews.map((row) => (
                <div className="cx-item" key={row.id}>
                  <div className="cx-item-top">
                    <strong>{row.author || 'Reviewer'}</strong>
                    <span>{row.rating != null ? `${row.rating}★` : '—'}</span>
                  </div>
                  <p>{row.text || 'No comment'}</p>
                  <span className="hint">
                    {when(row.reviewed_at)} · {row.replied ? 'Replied' : 'No reply'}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty muted">No reviews yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

function MappingTable({ title, rows, fields, divisions, onSave, onDelete }) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.key === 'active' ? true : field.key === 'priority' ? 100 : ''])),
  )

  return (
    <article className="jobber-panel span-12 mapping-panel anim-rise">
      <header className="jobber-panel-head">
        <div>
          <h3>{title}</h3>
          <p>POST to save or delete rules</p>
        </div>
      </header>
      <table className="table">
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field.key}>{field.label}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {fields.map((field) => (
                <td key={field.key}>
                  {field.key === 'active' ? (row.active ? 'Yes' : 'No') : row[field.key]}
                </td>
              ))}
              <td>
                <button className="ghost tiny" type="button" onClick={() => onDelete(row.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          <tr>
            {fields.map((field) => (
              <td key={field.key}>
                {field.key === 'division' && divisions?.length ? (
                  <select
                    value={draft.division || ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, division: e.target.value }))}
                  >
                    <option value="">Division</option>
                    {divisions.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                ) : field.key === 'active' ? (
                  <select
                    value={draft.active ? 'true' : 'false'}
                    onChange={(e) => setDraft((prev) => ({ ...prev, active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : (
                  <input
                    value={draft[field.key] ?? ''}
                    type={field.key === 'priority' ? 'number' : 'text'}
                    placeholder={field.label}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [field.key]: field.key === 'priority' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                  />
                )}
              </td>
            ))}
            <td>
              <button
                className="primary tiny"
                type="button"
                onClick={async () => {
                  await onSave(draft)
                  setDraft(
                    Object.fromEntries(
                      fields.map((field) => [field.key, field.key === 'active' ? true : field.key === 'priority' ? 100 : '']),
                    ),
                  )
                }}
              >
                Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}

function MappingsView() {
  const [serviceRows, setServiceRows] = useState(null)
  const [divisionRows, setDivisionRows] = useState(null)
  const [divisions, setDivisions] = useState([])
  const [error, setError] = useState('')

  async function reload() {
    const [services, rules] = await Promise.all([
      readJson(await api('/api/operations/mappings/service-types/')),
      readJson(await api('/api/operations/mappings/divisions/')),
    ])
    setServiceRows(services.results || [])
    setDivisionRows(rules.results || [])
    setDivisions(rules.divisions || [])
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message))
  }, [])

  async function postMapping(path, body) {
    await readJson(
      await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    )
    await reload()
  }

  if (!serviceRows || !divisionRows) return <p className="empty muted">Loading…</p>

  return (
    <div className="jobber-board">
      {error ? <div className="notice">{error}</div> : null}
      <section className="jobber-bento">
        <MappingTable
          title="Service type mappings"
          rows={serviceRows}
          fields={[
            { key: 'keyword', label: 'Keyword' },
            { key: 'service_type', label: 'Service type' },
            { key: 'priority', label: 'Priority' },
            { key: 'active', label: 'Active' },
          ]}
          onSave={(draft) => postMapping('/api/operations/mappings/service-types/', draft)}
          onDelete={(id) => postMapping('/api/operations/mappings/service-types/', { id, delete: true })}
        />
        <MappingTable
          title="Division rules"
          rows={divisionRows}
          divisions={divisions}
          fields={[
            { key: 'keyword', label: 'Keyword' },
            { key: 'division', label: 'Division' },
            { key: 'priority', label: 'Priority' },
            { key: 'active', label: 'Active' },
          ]}
          onSave={(draft) => postMapping('/api/operations/mappings/divisions/', draft)}
          onDelete={(id) => postMapping('/api/operations/mappings/divisions/', { id, delete: true })}
        />
      </section>
    </div>
  )
}

const INTERNAL_KPI_META = {
  headcount_active: { tone: 'teal', hint: 'People on roster' },
  leave_pending: { tone: 'amber', hint: 'Needs review' },
  leave_approval_rate: { tone: 'slate', hint: 'Approved share' },
  bonus_total: { tone: 'blue', hint: 'All lock-in bonuses' },
  bonus_paid: { tone: 'teal', hint: 'Already paid out' },
  pending_lock_ins: { tone: 'rose', hint: 'Open quotes' },
  visits_total: { tone: 'blue', hint: 'Tracked visits' },
  vacation_pool: { tone: 'slate', hint: 'Days remaining' },
  absences: { tone: 'amber', hint: 'Absence count' },
  late_arrivals: { tone: 'rose', hint: 'Late arrivals' },
  attendance_days: { tone: 'teal', hint: 'Days attended' },
}

function TeamIcon() {
  return (
    <svg className="internal-hero-icon" viewBox="0 0 56 56" aria-hidden="true">
      <circle className="ih-ring" cx="28" cy="28" r="24" />
      <circle className="ih-head main" cx="28" cy="22" r="7" />
      <path className="ih-body main" d="M16 40c2.5-7 7-10 12-10s9.5 3 12 10" />
      <circle className="ih-head side left" cx="16" cy="24" r="5" />
      <path className="ih-body side left" d="M8 39c1.8-5 5-7.5 8-7.5" />
      <circle className="ih-head side right" cx="40" cy="24" r="5" />
      <path className="ih-body side right" d="M48 39c-1.8-5-5-7.5-8-7.5" />
    </svg>
  )
}

function LeaveIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="is-bg leave" x="9" y="8" width="22" height="24" rx="5" />
      <path className="is-mark" d="M15 16h10M15 21h10M15 26h6" />
      <circle className="is-dot" cx="28" cy="12" r="3" />
    </svg>
  )
}

function BonusIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg bonus" cx="20" cy="20" r="13" />
      <path className="is-mark" d="M20 13v14M15 18h10M15 23h10" />
    </svg>
  )
}

function LockinIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="is-bg lockin" x="10" y="16" width="20" height="14" rx="3" />
      <path className="is-mark lock" d="M14 16v-3a6 6 0 0 1 12 0v3" />
      <circle className="is-dot" cx="20" cy="23" r="2" />
    </svg>
  )
}

function RateIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg rate" cx="20" cy="20" r="12" />
      <path className="is-mark" d="M12 22l5 5 11-12" />
    </svg>
  )
}

function PaidIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="is-bg paid" x="8" y="12" width="24" height="16" rx="4" />
      <circle className="is-dot" cx="20" cy="20" r="3.5" />
    </svg>
  )
}

function VisitsIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <path className="is-bg visits" d="M20 8c-5 0-9 3.8-9 8.6 0 5.4 7.2 13.2 8.5 14.5a.7.7 0 0 0 1 0C21.8 29.8 29 22 29 16.6 29 11.8 25 8 20 8z" />
      <circle className="is-dot visits-core" cx="20" cy="16.5" r="3" />
    </svg>
  )
}

function VacationIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg vacation" cx="20" cy="20" r="12" />
      <path className="is-mark" d="M20 12v8l5 3" />
    </svg>
  )
}

const INTERNAL_TOP_ICONS = {
  leave_pending: LeaveIcon,
  bonus_total: BonusIcon,
  pending_lock_ins: LockinIcon,
}

const INTERNAL_STRIP_ICONS = {
  leave_approval_rate: RateIcon,
  bonus_paid: PaidIcon,
  visits_total: VisitsIcon,
  vacation_pool: VacationIcon,
}

function RoleSpark({ data = [] }) {
  const values = data.map((item) => Number(item.count || item.value || 0))
  if (!values.length) return <div className="internal-spark empty" />
  const max = Math.max(...values, 1)
  const width = 160
  const height = 48
  const barW = Math.max(10, (width - (values.length - 1) * 6) / values.length)
  return (
    <svg className="internal-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {values.map((value, index) => {
        const h = Math.max(4, (value / max) * (height - 6))
        const x = index * (barW + 6)
        return <rect key={index} className="internal-spark-bar" x={x} y={height - h} width={barW} height={h} rx="4" />
      })}
    </svg>
  )
}

function InternalOverview({ dash, onKpi }) {
  const kpis = dash.kpis || []
  const hero = kpis.find((kpi) => kpi.key === 'headcount_active')
  const leavePending = kpis.find((kpi) => kpi.key === 'leave_pending')
  const bonus = kpis.find((kpi) => kpi.key === 'bonus_total')
  const lockins = kpis.find((kpi) => kpi.key === 'pending_lock_ins')
  const topStats = [leavePending, bonus, lockins].filter(Boolean)
  const rest = kpis.filter((kpi) => !['headcount_active', 'leave_pending', 'bonus_total', 'pending_lock_ins'].includes(kpi.key))

  const leaveStatus = (dash.charts?.leave_status || []).map((row) => ({ ...row, value: row.count }))
  const leaveType = (dash.charts?.leave_type || []).map((row) => ({ ...row, value: row.count }))
  const roles = (dash.charts?.roles || []).map((row) => ({ ...row, value: row.count }))
  const positions = (dash.charts?.positions || []).map((row) => ({ ...row, value: row.count }))
  const bonusStatus = (dash.charts?.bonus_status || []).map((row) => ({
    ...row,
    value: row.count,
    revenue: row.amount,
  }))

  return (
    <div className="internal-board">
      <section className="internal-top-grid">
        {hero ? (
          <button
            type="button"
            className="internal-hero-card anim-rise"
            style={{ '--delay': '40ms' }}
            onClick={() => onKpi(hero.view, hero.filters || {})}
          >
            <div className="internal-hero-main">
              <div className="internal-hero-icon-wrap">
                <TeamIcon />
              </div>
              <div>
                <span className="internal-eyebrow">Workforce</span>
                <AnimatedMetric kpi={hero} delay={40} />
                <p>{INTERNAL_KPI_META.headcount_active.hint}</p>
              </div>
            </div>
            <RoleSpark data={dash.charts?.roles || []} />
          </button>
        ) : null}

        {topStats.map((kpi, index) => {
          const meta = INTERNAL_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
          const Icon = INTERNAL_TOP_ICONS[kpi.key]
          return (
            <button
              key={kpi.key}
              type="button"
              className={`internal-stat tone-${meta.tone} anim-rise`}
              style={{ '--delay': `${120 + index * 70}ms` }}
              onClick={() => onKpi(kpi.view, kpi.filters || {})}
            >
              <div className="internal-stat-top">
                <span>{kpi.label}</span>
                {Icon ? (
                  <span className={`internal-icon-wrap ${kpi.key}`}>
                    <Icon />
                  </span>
                ) : null}
              </div>
              <AnimatedMetric kpi={kpi} delay={120 + index * 70} />
              <em>{meta.hint}</em>
            </button>
          )
        })}
      </section>

      {rest.length ? (
        <section className="internal-strip">
          {rest.map((kpi, index) => {
            const meta = INTERNAL_KPI_META[kpi.key] || { tone: 'slate', hint: '' }
            const Icon = INTERNAL_STRIP_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`internal-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${320 + index * 50}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="internal-stat-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`internal-icon-wrap strip ${kpi.key}`}>
                      <Icon />
                    </span>
                  ) : null}
                </div>
                <AnimatedMetric kpi={kpi} delay={320 + index * 50} />
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="internal-bento">
        <article className="internal-panel span-7 anim-rise" style={{ '--delay': '420ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Leave by type</h3>
              <p>Column mix · click to filter</p>
            </div>
          </header>
          <ColumnChart
            color="#0f766e"
            valueLabel="Count"
            data={leaveType}
            onSelect={(item) => onKpi('leave', { leave_type: item.key })}
          />
        </article>

        <article className="internal-panel span-5 anim-rise" style={{ '--delay': '500ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Leave status</h3>
              <p>Segmented pipeline</p>
            </div>
          </header>
          <SegmentedBar
            colors={INTERNAL_COLORS}
            data={leaveStatus}
            onSelect={(item) => onKpi('leave', { status: item.key })}
          />
        </article>

        <article className="internal-panel span-5 anim-rise" style={{ '--delay': '580ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Team by role</h3>
              <p>Headcount ranking</p>
            </div>
          </header>
          <RankBars
            valueLabel="People"
            data={roles}
            onSelect={(item) => onKpi('employees', { role: item.key })}
          />
        </article>

        <article className="internal-panel span-7 anim-rise" style={{ '--delay': '640ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Bonus pipeline</h3>
              <p>Status mix with amounts</p>
            </div>
          </header>
          <SegmentedBar
            colors={['#2563eb', '#0f766e', '#f59e0b', '#e11d48', '#64748b']}
            data={bonusStatus}
            onSelect={(item) => onKpi('bonuses', { status: item.key })}
          />
        </article>

        <article className="internal-panel span-8 anim-rise" style={{ '--delay': '700ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Positions</h3>
              <p>Where people sit in the org</p>
            </div>
          </header>
          <ColumnChart
            color="#2563eb"
            valueLabel="Count"
            data={positions}
            onSelect={(item) => onKpi('employees', { position: item.key })}
          />
        </article>

        <article className="internal-panel span-4 alerts-panel anim-rise" style={{ '--delay': '760ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Alerts</h3>
              <p>Active hub notices</p>
            </div>
          </header>
          {dash.alerts?.length ? (
            <div className="alert-list">
              {dash.alerts.map((alert, index) => (
                <div className="alert-item anim-rise" key={alert.id} style={{ '--delay': `${800 + index * 70}ms` }}>
                  <span className="alert-dot" />
                  <p>{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty muted">No active alerts.</p>
          )}
        </article>

        <article className="internal-panel span-12 list-panel anim-rise" style={{ '--delay': '820ms' }}>
          <header className="internal-panel-head">
            <div>
              <h3>Recent leave</h3>
              <p>Latest requests in your DB</p>
            </div>
            <button className="ghost tiny" type="button" onClick={() => onKpi('leave', {})}>
              View all
            </button>
          </header>
          <LeaveTable rows={(dash.recent_leave || []).slice(0, 8)} compact />
        </article>
      </section>
    </div>
  )
}

function FilterBar({ view, filters, setFilter, filterOptions, search, setSearch }) {
  const employees = filterOptions?.employees || {}
  const leave = filterOptions?.leave || {}
  const bonuses = filterOptions?.bonuses || {}
  const lockins = filterOptions?.lockins || {}
  const visits = filterOptions?.visits || {}

  return (
    <div className="toolbar filters">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={`Search ${view}`}
      />
      {view === 'employees' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {(employees.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.role || ''} onChange={(e) => setFilter('role', e.target.value)}>
            <option value="">All roles</option>
            {(employees.roles || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.position || ''} onChange={(e) => setFilter('position', e.target.value)}>
            <option value="">All positions</option>
            {(employees.positions || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </>
      ) : null}
      {view === 'leave' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {(leave.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.leave_type || ''} onChange={(e) => setFilter('leave_type', e.target.value)}>
            <option value="">All types</option>
            {(leave.types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input type="date" value={filters.from || ''} onChange={(e) => setFilter('from', e.target.value)} />
          <input type="date" value={filters.to || ''} onChange={(e) => setFilter('to', e.target.value)} />
        </>
      ) : null}
      {view === 'bonuses' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {(bonuses.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.bonus_type || ''} onChange={(e) => setFilter('bonus_type', e.target.value)}>
            <option value="">All types</option>
            {(bonuses.types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.paid || ''} onChange={(e) => setFilter('paid', e.target.value)}>
            <option value="">Paid or unpaid</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
          </select>
        </>
      ) : null}
      {view === 'lockins' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {(lockins.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.locked_in || ''} onChange={(e) => setFilter('locked_in', e.target.value)}>
            <option value="">Locked or pending</option>
            <option value="true">Locked in</option>
            <option value="false">Not locked</option>
          </select>
        </>
      ) : null}
      {view === 'visits' ? (
        <>
          <select value={filters.job_type || ''} onChange={(e) => setFilter('job_type', e.target.value)}>
            <option value="">All job types</option>
            {(visits.job_types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input type="date" value={filters.from || ''} onChange={(e) => setFilter('from', e.target.value)} />
          <input type="date" value={filters.to || ''} onChange={(e) => setFilter('to', e.target.value)} />
        </>
      ) : null}
      {view === 'submissions' ? (
        <>
          <select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {(filterOptions?.submissions?.statuses || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.property_type || ''} onChange={(e) => setFilter('property_type', e.target.value)}>
            <option value="">All property types</option>
            {(filterOptions?.submissions?.property_types || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.location || ''} onChange={(e) => setFilter('location', e.target.value)}>
            <option value="">All locations</option>
            {(filterOptions?.submissions?.locations || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={filters.coupon || ''} onChange={(e) => setFilter('coupon', e.target.value)}>
            <option value="">Coupon any</option>
            <option value="true">With coupon</option>
            <option value="false">No coupon</option>
          </select>
        </>
      ) : null}
      {view === 'packages' ? (
        <select value={filters.service || ''} onChange={(e) => setFilter('service', e.target.value)}>
          <option value="">All services</option>
          {(filterOptions?.packages?.services || []).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}

function InternalListView({ view, list, search, setSearch, filters, setFilter, filterOptions, onPage }) {
  return (
    <article className="panel list-panel internal-list anim-rise" style={{ '--delay': '80ms' }}>
      <header className="panel-head">
        <div>
          <h3>{view.charAt(0).toUpperCase() + view.slice(1)}</h3>
          <p>Filter and search stored hub records</p>
        </div>
        <span className="meta-pill">{number(list?.count || 0)} total</span>
      </header>
      <FilterBar
        view={view}
        filters={filters}
        setFilter={setFilter}
        filterOptions={filterOptions}
        search={search}
        setSearch={setSearch}
      />
      {!list ? <p className="empty muted">Loading…</p> : null}
      {list && !list.results.length ? <p className="empty muted">Nothing here yet.</p> : null}
      {view === 'employees' && list ? <EmployeeTable rows={list.results} /> : null}
      {view === 'leave' && list ? <LeaveTable rows={list.results} /> : null}
      {view === 'bonuses' && list ? <BonusTable rows={list.results} /> : null}
      {view === 'lockins' && list ? <LockInTable rows={list.results} /> : null}
      {view === 'visits' && list ? <HubVisitTable rows={list.results} /> : null}
      {list?.pages > 1 ? (
        <div className="pager">
          <button type="button" disabled={list.page <= 1} onClick={() => onPage(list.page - 1)}>
            Previous
          </button>
          <span className="hint">
            Page {list.page} of {list.pages}
          </span>
          <button type="button" disabled={list.page >= list.pages} onClick={() => onPage(list.page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </article>
  )
}

function JobberFilterBar({ filters, setFilter, filterOptions, search, setSearch, view }) {
  const employees = filterOptions?.employees || []
  const divisions = filterOptions?.divisions || []
  const serviceTypes = filterOptions?.service_types || []
  const cities = filterOptions?.cities || []
  const sources = filterOptions?.sources || []

  return (
    <div className="toolbar filters">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={view === 'clients' ? 'Search customers' : `Search ${view}`}
      />
      <input type="date" value={filters.from || ''} onChange={(e) => setFilter('from', e.target.value)} />
      <input type="date" value={filters.to || ''} onChange={(e) => setFilter('to', e.target.value)} />
      <select value={filters.division || ''} onChange={(e) => setFilter('division', e.target.value)}>
        <option value="">All divisions</option>
        {divisions.map((item) => (
          <option key={item.key || item} value={item.key || item}>
            {item.label || item}
          </option>
        ))}
      </select>
      <select value={filters.employee || ''} onChange={(e) => setFilter('employee', e.target.value)}>
        <option value="">All employees</option>
        {employees.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <select value={filters.team_leader || ''} onChange={(e) => setFilter('team_leader', e.target.value)}>
        <option value="">All team leaders</option>
        {employees.map((item) => (
          <option key={`tl-${item.id}`} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <input
        value={filters.customer || ''}
        onChange={(e) => setFilter('customer', e.target.value)}
        placeholder="Customer"
      />
      <select value={filters.service_type || ''} onChange={(e) => setFilter('service_type', e.target.value)}>
        <option value="">All service types</option>
        {serviceTypes.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select value={filters.city || ''} onChange={(e) => setFilter('city', e.target.value)}>
        <option value="">All cities</option>
        {cities.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select value={filters.source || ''} onChange={(e) => setFilter('source', e.target.value)}>
        <option value="">All sales sources</option>
        {sources.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  )
}

function ListView({ view, list, search, setSearch, filters, setFilter, filterOptions, onPage, onOpen }) {
  return (
    <article className="card list-card">
      <JobberFilterBar
        view={view}
        filters={filters || {}}
        setFilter={setFilter}
        filterOptions={filterOptions}
        search={search}
        setSearch={setSearch}
      />
      {!list ? <p className="empty muted">Loading…</p> : null}
      {list && !list.results.length ? <p className="empty muted">Nothing here yet.</p> : null}
      {view === 'visits' && list ? <VisitTable rows={list.results} onOpen={(id) => onOpen('visits', id)} /> : null}
      {view === 'jobs' && list ? (
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Type</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {list.results.map((job) => (
              <tr key={job.id}>
                <td>
                  <button type="button" onClick={() => onOpen('jobs', job.id)}>
                    {job.title}
                  </button>
                </td>
                <td>{job.client || '—'}</td>
                <td>
                  <span className="chip">{job.status}</span>
                </td>
                <td>{job.kind}</td>
                <td>{money(job.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {view === 'clients' && list ? (
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Jobs</th>
              <th>Visits</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {list.results.map((client) => (
              <tr key={client.id}>
                <td>
                  <button type="button" onClick={() => onOpen('clients', client.id)}>
                    {client.name}
                  </button>
                </td>
                <td>{client.email || client.phone || '—'}</td>
                <td>{number(client.jobs)}</td>
                <td>{number(client.visits)}</td>
                <td>{money(client.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {view === 'invoices' && list ? (
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Issued</th>
              <th>Status</th>
              <th>Total</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {list.results.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <button type="button" onClick={() => onOpen('invoices', invoice.id)}>
                    {invoice.number}
                  </button>
                </td>
                <td>{invoice.client || '—'}</td>
                <td>{when(invoice.issued_at)}</td>
                <td>
                  <span className="chip">{invoice.status}</span>
                </td>
                <td>{money(invoice.total)}</td>
                <td>{money(invoice.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {list?.pages > 1 ? (
        <div className="pager">
          <button type="button" disabled={list.page <= 1} onClick={() => onPage(list.page - 1)}>
            Previous
          </button>
          <span className="hint">
            Page {list.page} of {list.pages}
          </span>
          <button type="button" disabled={list.page >= list.pages} onClick={() => onPage(list.page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </article>
  )
}

function EmployeeTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Position</th>
          <th>Status</th>
          <th>Absences</th>
          <th>Late</th>
          <th>Vacation</th>
          <th>Attendance</th>
          <th>Bonus</th>
          <th>Visits</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <div>{row.name}</div>
              <div className="hint">{row.email || row.phone || '—'}</div>
            </td>
            <td>{row.role}</td>
            <td>{row.position}</td>
            <td>
              <span className={`chip ${row.status === 'active' ? 'good' : ''}`}>{row.status}</span>
            </td>
            <td>{number(row.absences)}</td>
            <td>{number(row.late_arrivals)}</td>
            <td>{number(row.vacations ?? row.available_vacation_days)}</td>
            <td>{row.attendance_days != null ? number(row.attendance_days) : '—'}</td>
            <td>{money(row.bonus_amount)}</td>
            <td>{number(row.visits)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LeaveTable({ rows, compact = false }) {
  return (
    <table className={`table ${compact ? 'table-compact' : ''}`}>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Type</th>
          {!compact ? <th>Dates</th> : null}
          <th>Status</th>
          {!compact ? <th>Days</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <div>{row.employee || '—'}</div>
              {compact ? <div className="hint">{when(row.start_date)}</div> : null}
            </td>
            <td>{row.leave_type}</td>
            {!compact ? (
              <td>
                {when(row.start_date)} → {when(row.end_date)}
              </td>
            ) : null}
            <td>
              <span className={`chip ${row.status === 'approved' ? 'good' : row.status === 'rejected' ? 'bad' : ''}`}>
                {row.status}
              </span>
            </td>
            {!compact ? <td>{row.weekday_count ?? '—'}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BonusTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Employee</th>
          <th>Type</th>
          <th>Client</th>
          <th>Status</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.employee || '—'}</td>
            <td>{row.bonus_type}</td>
            <td>{row.client || '—'}</td>
            <td>
              <span className={`chip ${row.paid ? 'good' : ''}`}>{row.status}</span>
            </td>
            <td>{money(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LockInTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Client</th>
          <th>Quote</th>
          <th>Status</th>
          <th>Frequency</th>
          <th>Team</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.client || '—'}</td>
            <td>{row.quote_id || '—'}</td>
            <td>
              <span className={`chip ${row.locked_in ? 'good' : ''}`}>{row.status}</span>
            </td>
            <td>{row.frequency || '—'}</td>
            <td>{row.team?.join(', ') || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function HubVisitTable({ rows }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Visit</th>
          <th>Client</th>
          <th>When</th>
          <th>Type</th>
          <th>Team</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.title}</td>
            <td>{row.client || '—'}</td>
            <td>{when(row.start_at, true)}</td>
            <td>{row.job_type || '—'}</td>
            <td>{row.team?.join(', ') || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function VisitTable({ rows, onOpen }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Visit</th>
          <th>Customer</th>
          <th>When</th>
          <th>Status</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((visit) => (
          <tr key={visit.id}>
            <td>
              <button type="button" onClick={() => onOpen(visit.id)}>
                {visit.title}
              </button>
            </td>
            <td>{visit.client || '—'}</td>
            <td>{when(visit.start_at, true)}</td>
            <td>
              <span className={`chip ${visit.status === 'Completed' ? 'good' : ''}`}>{visit.status}</span>
            </td>
            <td>{money(visit.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Field({ label, children }) {
  if (!children) return null
  return (
    <div>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  )
}

function Drawer({ payload, onBack, onOpen }) {
  const item = payload.item || {}
  return (
    <div className="drawer-backdrop" onClick={onBack} role="presentation">
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <button className="back" type="button" onClick={onBack}>
          ← Back
        </button>
        <h2>{item.title || item.name || item.number}</h2>
        <div className="details">
          <Field label="Status">{item.status}</Field>
          <Field label="Customer">
            {item.client_id ? (
              <button type="button" onClick={() => onOpen('clients', item.client_id)}>
                {item.client}
              </button>
            ) : (
              item.client
            )}
          </Field>
          <Field label="When">{when(item.start_at || item.issued_at, Boolean(item.start_at))}</Field>
          <Field label="Type">{item.kind}</Field>
          <Field label="Address">{item.address}</Field>
          <Field label="Team">{item.team?.join(', ')}</Field>
          <Field label="Phone">{item.phone}</Field>
          <Field label="Email">{item.email}</Field>
          <Field label="Total">{item.total != null ? money(item.total) : item.amount != null ? money(item.amount) : null}</Field>
          <Field label="Balance">{item.balance != null ? money(item.balance) : null}</Field>
          <Field label="Paid">{item.paid != null ? money(item.paid) : null}</Field>
          <Field label="Notes">{item.instructions || item.subject}</Field>
        </div>
        {item.line_items?.length ? (
          <div className="stack">
            <p className="hint">Line items</p>
            {item.line_items.map((line, index) => (
              <div className="line" key={`${line.name}-${index}`}>
                {line.name} · {money(line.total)}
              </div>
            ))}
          </div>
        ) : null}
        {item.visits?.length ? (
          <div className="stack" style={{ marginTop: 16 }}>
            <p className="hint">Visits</p>
            {item.visits.map((visit) => (
              <button key={visit.id} type="button" onClick={() => onOpen('visits', visit.id)}>
                {visit.title} · {when(visit.start_at)}
              </button>
            ))}
          </div>
        ) : null}
        {item.jobs?.length ? (
          <div className="stack" style={{ marginTop: 16 }}>
            <p className="hint">Jobs</p>
            {item.jobs.map((job) => (
              <button key={job.id} type="button" onClick={() => onOpen('jobs', job.id)}>
                {job.title}
              </button>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  )
}

const PRICING_KPI_META = {
  submissions: { tone: 'cyan', hint: 'All quotes' },
  revenue: { tone: 'ink', hint: 'Final totals' },
  avg_quote: { tone: 'coral', hint: 'Average quote' },
  pipeline: { tone: 'cyan', hint: 'Active pipeline' },
  approved: { tone: 'ink', hint: 'Approved quotes' },
  approval_rate: { tone: 'coral', hint: 'Approved share' },
  services: { tone: 'ink', hint: 'Catalog' },
  locations: { tone: 'coral', hint: 'Service areas' },
  coupons: { tone: 'cyan', hint: 'Discounted quotes' },
  addons_revenue: { tone: 'ink', hint: 'Add-on volume' },
}

function MoneyIcon() {
  return (
    <svg className="pricing-money-icon" viewBox="0 0 48 48" aria-hidden="true">
      <circle className="pricing-money-ring" cx="24" cy="24" r="20" />
      <circle className="pricing-money-coin" cx="24" cy="24" r="14" />
      <path
        className="pricing-money-mark"
        d="M24 14v2.2c2.8.3 4.8 1.8 4.8 4.1 0 2.5-2.1 3.7-5.2 4.3l-1.4.3c-1.7.3-2.5.8-2.5 1.8s1 1.7 2.6 1.7c1.8 0 2.9-.7 3.4-1.8l2.3 1.2c-.9 2-2.9 3.2-5.4 3.5V34h-2.6v-2.1c-2.9-.3-5-1.9-5-4.4 0-2.7 2.2-4 5.4-4.6l1.4-.3c1.6-.3 2.3-.8 2.3-1.7s-.8-1.5-2.3-1.5c-1.5 0-2.5.6-3 1.6l-2.3-1.2c.9-1.9 2.9-3.1 5.3-3.4V14H24z"
      />
    </svg>
  )
}

function MiniSpark({ data = [] }) {
  const values = data.map((item) => Number(item.value || 0))
  if (!values.length) {
    return <div className="pricing-spark empty" />
  }
  const max = Math.max(...values, 1)
  const width = 160
  const height = 48
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = height - (value / max) * (height - 8) - 4
      return `${x},${y}`
    })
    .join(' ')
  const area = `0,${height} ${points} ${width},${height}`

  return (
    <svg className="pricing-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline className="pricing-spark-area" points={area} />
      <polyline className="pricing-spark-line" points={points} />
    </svg>
  )
}

function QuotesIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="stat-icon-bg quotes" x="6" y="8" width="28" height="24" rx="6" />
      <path className="stat-icon-mark" d="M13 16h14M13 20h10M13 24h12" />
      <circle className="stat-icon-dot" cx="30" cy="12" r="3" />
    </svg>
  )
}

function AvgIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="stat-icon-bg avg" cx="20" cy="20" r="13" />
      <path className="stat-icon-mark" d="M14 22c2.2 2.4 4.4 3.6 6 3.6s3.8-1.2 6-3.6" />
      <path className="stat-icon-mark" d="M20 13v8" />
      <circle className="stat-icon-dot" cx="20" cy="12" r="2.2" />
    </svg>
  )
}

function PipelineIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="stat-icon-bg pipeline" x="7" y="18" width="7" height="12" rx="2" />
      <rect className="stat-icon-bg pipeline mid" x="16.5" y="13" width="7" height="17" rx="2" />
      <rect className="stat-icon-bg pipeline tall" x="26" y="8" width="7" height="22" rx="2" />
    </svg>
  )
}

function ServicesIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="stat-icon-bg services" x="8" y="10" width="24" height="20" rx="5" />
      <path className="stat-icon-mark" d="M14 17h12M14 21h8M14 25h10" />
      <circle className="stat-icon-dot" cx="28" cy="14" r="2.4" />
    </svg>
  )
}

function LocationsIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <path
        className="stat-icon-bg locations"
        d="M20 8c-5 0-9 3.8-9 8.6 0 5.4 7.2 13.2 8.5 14.5a.7.7 0 0 0 1 0C21.8 29.8 29 22 29 16.6 29 11.8 25 8 20 8z"
      />
      <circle className="stat-icon-dot locations-core" cx="20" cy="16.5" r="3.2" />
    </svg>
  )
}

function CouponsIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <path
        className="stat-icon-bg coupons"
        d="M8 16.5c0-2.5 2-4.5 4.5-4.5h15c2.5 0 4.5 2 4.5 4.5v1.2a2.2 2.2 0 0 0 0 4.4v1.2c0 2.5-2 4.5-4.5 4.5h-15C10 27.8 8 25.8 8 23.3v-1.2a2.2 2.2 0 0 0 0-4.4v-1.2z"
      />
      <circle className="stat-icon-dot" cx="15" cy="17" r="1.6" />
      <circle className="stat-icon-dot" cx="15" cy="23" r="1.6" />
      <path className="stat-icon-mark coupons-dash" d="M22 15.5v9" />
    </svg>
  )
}

function AddonsIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="stat-icon-bg addons" cx="20" cy="20" r="12" />
      <path className="stat-icon-mark" d="M20 14v12M14 20h12" />
    </svg>
  )
}

const TOP_STAT_ICONS = {
  submissions: QuotesIcon,
  avg_quote: AvgIcon,
  pipeline: PipelineIcon,
}

const STRIP_STAT_ICONS = {
  services: ServicesIcon,
  locations: LocationsIcon,
  coupons: CouponsIcon,
  addons_revenue: AddonsIcon,
}

function PricingOverview({ dash, onKpi, onOpen }) {
  const kpis = dash.kpis || []
  const hero = kpis.find((kpi) => kpi.key === 'revenue')
  const quotes = kpis.find((kpi) => kpi.key === 'submissions')
  const avg = kpis.find((kpi) => kpi.key === 'avg_quote')
  const pipeline = kpis.find((kpi) => kpi.key === 'pipeline')
  const approved = kpis.find((kpi) => kpi.key === 'approved')
  const approvalRate = kpis.find((kpi) => kpi.key === 'approval_rate')
  const rest = kpis.filter(
    (kpi) => !['revenue', 'submissions', 'avg_quote', 'pipeline', 'approved', 'approval_rate'].includes(kpi.key),
  )
  const topStats = [quotes, avg, pipeline].filter(Boolean)
  const approvalStrip = [approved, approvalRate].filter(Boolean)

  return (
    <div className="pricing-board">
      <section className="pricing-top-grid">
        {hero ? (
          <button
            type="button"
            className="pricing-revenue-card anim-rise"
            style={{ '--delay': '40ms' }}
            onClick={() => onKpi(hero.view, hero.filters || {})}
          >
            <div className="pricing-revenue-main">
              <div className="pricing-revenue-icon-wrap">
                <MoneyIcon />
              </div>
              <div>
                <span className="pricing-eyebrow">Quote volume</span>
                <AnimatedMetric kpi={hero} delay={40} />
                <p>{PRICING_KPI_META.revenue.hint}</p>
              </div>
            </div>
            <MiniSpark data={dash.charts?.monthly || []} />
          </button>
        ) : null}

        {topStats.map((kpi, index) => {
          const meta = PRICING_KPI_META[kpi.key] || { tone: 'cyan', hint: '' }
          const Icon = TOP_STAT_ICONS[kpi.key]
          return (
            <button
              key={kpi.key}
              type="button"
              className={`pricing-stat tone-${meta.tone} anim-rise`}
              style={{ '--delay': `${120 + index * 70}ms` }}
              onClick={() => onKpi(kpi.view, kpi.filters || {})}
            >
              <div className="pricing-stat-top">
                <span>{kpi.label}</span>
                {Icon ? (
                  <span className={`pricing-stat-icon-wrap ${kpi.key}`}>
                    <Icon />
                  </span>
                ) : null}
              </div>
              <AnimatedMetric kpi={kpi} delay={120 + index * 70} />
              <em>{meta.hint}</em>
            </button>
          )
        })}
      </section>

      {approvalStrip.length || rest.length ? (
        <section className="pricing-strip">
          {[...approvalStrip, ...rest].map((kpi, index) => {
            const meta = PRICING_KPI_META[kpi.key] || { tone: 'ink', hint: '' }
            const Icon = STRIP_STAT_ICONS[kpi.key]
            return (
              <button
                key={kpi.key}
                type="button"
                className={`pricing-strip-card tone-${meta.tone} anim-rise`}
                style={{ '--delay': `${320 + index * 50}ms` }}
                onClick={() => onKpi(kpi.view, kpi.filters || {})}
              >
                <div className="pricing-strip-top">
                  <span>{kpi.label}</span>
                  {Icon ? (
                    <span className={`pricing-stat-icon-wrap strip ${kpi.key}`}>
                      <Icon />
                    </span>
                  ) : null}
                </div>
                <AnimatedMetric kpi={kpi} delay={320 + index * 50} />
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="pricing-bento">
        <article className="pricing-panel span-8 anim-rise" style={{ '--delay': '420ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Monthly quote volume</h3>
              <p>Column view · hover for revenue and count</p>
            </div>
          </header>
          <ColumnChart
            color="#0891b2"
            valueLabel="Revenue"
            data={dash.charts?.monthly || []}
            onSelect={(point) => {
              if (!point.month) return
              const [year, month] = point.month.split('-').map(Number)
              const start = `${point.month}-01`
              const end = new Date(year, month, 1).toISOString().slice(0, 10)
              onKpi('submissions', { from: start, to: end })
            }}
          />
        </article>

        <article className="pricing-panel span-4 anim-rise" style={{ '--delay': '500ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Status split</h3>
              <p>Segmented mix</p>
            </div>
          </header>
          <SegmentedBar data={dash.charts?.status || []} onSelect={(item) => onKpi('submissions', { status: item.key })} />
        </article>

        <article className="pricing-panel span-5 anim-rise" style={{ '--delay': '580ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Property mix</h3>
              <p>Counts by property type</p>
            </div>
          </header>
          <ColumnChart
            color="#f43f5e"
            valueLabel="Count"
            data={(dash.charts?.property || []).map((row) => ({ ...row, value: row.count || row.value }))}
            onSelect={(item) => onKpi('submissions', { property_type: item.key })}
          />
        </article>

        <article className="pricing-panel span-7 anim-rise" style={{ '--delay': '640ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Location leaderboard</h3>
              <p>Ranked by quote revenue</p>
            </div>
          </header>
          <RankBars
            valueLabel="Revenue"
            data={dash.charts?.locations || []}
            onSelect={(item) => onKpi('submissions', { location: item.key })}
          />
        </article>

        {dash.charts?.sales_by_source?.length ? (
          <article className="pricing-panel span-6 anim-rise" style={{ '--delay': '700ms' }}>
            <header className="pricing-panel-head">
              <div>
                <h3>Sales by source</h3>
                <p>Lead source revenue</p>
              </div>
            </header>
            <RankBars
              valueLabel="Revenue"
              data={dash.charts.sales_by_source}
              onSelect={(item) => onKpi('submissions', { source: item.key })}
            />
          </article>
        ) : null}

        <article className={`pricing-panel ${dash.charts?.sales_by_source?.length ? 'span-6' : 'span-4'} anim-rise`} style={{ '--delay': '740ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Catalog</h3>
              <p>Synced pricing objects</p>
            </div>
          </header>
          <div className="pricing-catalog">
            {Object.entries(dash.catalog_summary || {}).map(([key, value]) => (
              <button
                key={key}
                type="button"
                className="pricing-catalog-item"
                onClick={() => {
                  const map = {
                    services: 'services',
                    packages: 'packages',
                    locations: 'locations',
                    addons: 'addons',
                    coupons: 'coupons',
                    bundles: 'packages',
                  }
                  onKpi(map[key] || 'submissions', {})
                }}
              >
                <span>{key}</span>
                <strong>{number(value)}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="pricing-panel span-12 anim-rise" style={{ '--delay': '800ms' }}>
          <header className="pricing-panel-head">
            <div>
              <h3>Recent quotes</h3>
              <p>Latest stored submissions</p>
            </div>
            <button className="ghost tiny" type="button" onClick={() => onKpi('submissions', {})}>
              View all
            </button>
          </header>
          <PricingSubmissionTable rows={(dash.recent || []).slice(0, 6)} onOpen={(id) => onOpen('submissions', id)} compact />
        </article>
      </section>
    </div>
  )
}

function PricingListView({ view, list, search, setSearch, filters, setFilter, filterOptions, onPage, onOpen }) {
  return (
    <article className="pricing-panel internal-list anim-rise" style={{ '--delay': '80ms' }}>
      <header className="panel-head">
        <div>
          <h3>{view.charAt(0).toUpperCase() + view.slice(1)}</h3>
          <p>Filter and search stored pricing records</p>
        </div>
        <span className="meta-pill">{number(list?.count || 0)} total</span>
      </header>
      <FilterBar
        view={view}
        filters={filters}
        setFilter={setFilter}
        filterOptions={filterOptions}
        search={search}
        setSearch={setSearch}
      />
      {!list ? <p className="empty muted">Loading…</p> : null}
      {list && !list.results.length ? <p className="empty muted">Nothing here yet.</p> : null}
      {view === 'submissions' && list ? (
        <PricingSubmissionTable rows={list.results} onOpen={(id) => onOpen('submissions', id)} />
      ) : null}
      {view === 'services' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Service' },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
            { key: 'residential', label: 'Residential', render: (row) => (row.residential ? 'Yes' : '—') },
            { key: 'commercial', label: 'Commercial', render: (row) => (row.commercial ? 'Yes' : '—') },
          ]}
        />
      ) : null}
      {view === 'packages' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Package' },
            { key: 'service', label: 'Service' },
            { key: 'base_price', label: 'Base', render: (row) => money(row.base_price) },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
          ]}
        />
      ) : null}
      {view === 'locations' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Location' },
            { key: 'address', label: 'Address' },
            { key: 'trip_surcharge', label: 'Trip fee', render: (row) => money(row.trip_surcharge) },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
          ]}
        />
      ) : null}
      {view === 'coupons' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'percent', label: 'Percent', render: (row) => (row.percent != null ? `${row.percent}%` : '—') },
            { key: 'fixed', label: 'Fixed', render: (row) => (row.fixed != null ? money(row.fixed) : '—') },
            { key: 'used', label: 'Used' },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
          ]}
        />
      ) : null}
      {view === 'addons' && list ? (
        <SimplePricingTable
          rows={list.results}
          columns={[
            { key: 'name', label: 'Add-on' },
            { key: 'base_price', label: 'Price', render: (row) => money(row.base_price) },
            { key: 'global', label: 'Global', render: (row) => (row.global ? 'Yes' : 'No') },
          ]}
        />
      ) : null}
      {list?.pages > 1 ? (
        <div className="pager">
          <button type="button" disabled={list.page <= 1} onClick={() => onPage(list.page - 1)}>
            Previous
          </button>
          <span className="hint">
            Page {list.page} of {list.pages}
          </span>
          <button type="button" disabled={list.page >= list.pages} onClick={() => onPage(list.page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </article>
  )
}

function PricingSubmissionTable({ rows, onOpen, compact = false }) {
  return (
    <table className={`table ${compact ? 'table-compact' : ''}`}>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Status</th>
          {!compact ? <th>Property</th> : null}
          {!compact ? <th>Location</th> : null}
          {!compact ? <th>Source</th> : null}
          <th>Total</th>
          {!compact ? <th>Created</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <button type="button" onClick={() => onOpen?.(row.id)}>
                {row.customer}
              </button>
              <div className="hint">{row.email || row.phone || '—'}</div>
            </td>
            <td>
              <span className="chip">{row.status}</span>
            </td>
            {!compact ? <td>{row.property_type}</td> : null}
            {!compact ? <td>{row.location}</td> : null}
            {!compact ? <td>{row.lead_source || '—'}</td> : null}
            <td>{money(row.final_total)}</td>
            {!compact ? <td>{when(row.created_at)}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SimplePricingTable({ rows, columns }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={col.key}>{col.render ? col.render(row) : row[col.key] ?? '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PricingDrawer({ payload, onBack }) {
  const item = payload.item || {}
  const pricing = item.pricing || {}
  return (
    <div className="drawer-backdrop" onClick={onBack} role="presentation">
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <button className="back" type="button" onClick={onBack}>
          ← Back
        </button>
        <h2>{item.customer}</h2>
        <div className="details">
          <Field label="Status">{item.status}</Field>
          <Field label="Email">{item.email}</Field>
          <Field label="Phone">{item.phone}</Field>
          <Field label="Property">{item.property_type}</Field>
          <Field label="Location">{item.location}</Field>
          <Field label="Lead source">{item.lead_source}</Field>
          <Field label="Sqft">{item.sqft != null ? number(item.sqft) : null}</Field>
          <Field label="Services">{item.services?.join(', ')}</Field>
          <Field label="Coupon">{item.coupon}</Field>
          <Field label="Bundle">{item.bundle}</Field>
          <Field label="Base">{money(pricing.base)}</Field>
          <Field label="Add-ons">{money(pricing.addons)}</Field>
          <Field label="Discounts">{money((pricing.coupon_discount || 0) + (pricing.bundle_discount || 0))}</Field>
          <Field label="Final">{money(pricing.final_total ?? item.final_total)}</Field>
          <Field label="Created">{when(item.created_at, true)}</Field>
        </div>
      </aside>
    </div>
  )
}

export default App
