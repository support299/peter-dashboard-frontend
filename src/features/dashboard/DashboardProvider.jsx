import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  JOBBER_BOARD_VIEWS,
  JOBBER_LIST_PATH,
  JOBBER_NAV,
  INTERNAL_LIST_PATH,
  INTERNAL_NAV,
  PRICING_LIST_PATH,
  PRICING_NAV,
} from '../../config/navigation'
import { api, queryString, readJson } from '../../lib'

const SOURCES = new Set(['jobber', 'internal', 'pricing'])

const VIEWS_BY_SOURCE = {
  jobber: new Set(JOBBER_NAV.map((item) => item.id)),
  internal: new Set(INTERNAL_NAV.map((item) => item.id)),
  pricing: new Set(PRICING_NAV.map((item) => item.id)),
}

const DashboardContext = createContext(null)

export function dashboardPath(source, view = 'overview') {
  return `/${source}/${view}`
}

export function DashboardProvider({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  const source = SOURCES.has(segments[0]) ? segments[0] : 'jobber'
  const view = segments[1] || 'overview'
  const viewValid = VIEWS_BY_SOURCE[source]?.has(view)

  const [jobber, setJobber] = useState(null)
  const [internal, setInternal] = useState(null)
  const [pricing, setPricing] = useState(null)
  const [dash, setDash] = useState(null)
  const [board, setBoard] = useState(null)
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

  async function loadList(nextView = view, nextFilters = filters, page = 1, searchQuery = query) {
    const paths = source === 'jobber' ? JOBBER_LIST_PATH : source === 'internal' ? INTERNAL_LIST_PATH : PRICING_LIST_PATH
    const path = paths[nextView]
    if (!path) return null
    return readJson(await api(`${path}${queryString({ ...nextFilters, page, q: searchQuery })}`))
  }

  const openDetail = useCallback(
    async (kind, id) => {
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
    },
    [source, view, filters, search, detail],
  )

  // When the route view changes, reset list UI state for the new tab only.
  // Do this HERE (not in openView before navigate) so we never fetch the previous tab again.
  const prevViewRef = useRef(view)
  const pendingFiltersRef = useRef(null)
  const suppressListFetchRef = useRef(false)
  useEffect(() => {
    if (prevViewRef.current === view) return
    prevViewRef.current = view
    const pending = pendingFiltersRef.current
    pendingFiltersRef.current = null
    const nextFilters =
      pending && pending.view === view
        ? pending.filters || {}
        : source === 'jobber' && filters.division
          ? { division: filters.division }
          : {}
    // Skip one list fetch that would still see stale filters from the previous tab.
    suppressListFetchRef.current = true
    setList(null)
    setBoard(null)
    setDetail(null)
    setSearch('')
    setQuery('')
    setFilters(nextFilters)
  }, [view, source])

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
    let cancelled = false
    if (view === 'overview') return undefined
    if (source === 'jobber' && !connected) return undefined

    // View just changed: wait for the filter-reset effect's next render.
    if (suppressListFetchRef.current) {
      suppressListFetchRef.current = false
      return undefined
    }

    async function run() {
      try {
        if (source === 'jobber' && JOBBER_BOARD_VIEWS.has(view)) {
          setList(null)
          const paths = {
            oneoff: '/api/operations/one-off/',
            cancellations: '/api/operations/cancellations/dashboard/',
            cx: '/api/operations/cx/',
          }
          const path = paths[view]
          if (!path) return
          const boardPayload = await readJson(
            await api(
              `${path}${queryString({
                division: filters.division,
                from: filters.from,
                to: filters.to,
                service_type: filters.service_type,
                type: filters.type,
              })}`,
            ),
          )
          if (!cancelled) setBoard(boardPayload)
          return
        }
        if (source === 'jobber' && view === 'mappings') {
          setList(null)
          setBoard(null)
          return
        }
        const payload = await loadList(view, filters, 1, query)
        if (!cancelled && payload) setList(payload)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [source, connected, view, filters, query])

  const refresh = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      if (source === 'jobber') {
        const payload = await readJson(await api('/api/jobber/sync/', { method: 'POST' }))
        setJobber(payload.jobber)
      } else if (source === 'internal') {
        const payload = await readJson(await api('/api/admin-internal/sync/', { method: 'POST' }))
        setInternal((prev) => ({
          ...(prev || {}),
          sync: payload.sync,
          last_success: payload.sync,
          has_data: true,
        }))
        await loadInternalDash()
        await loadFilterOptions()
        if (view !== 'overview') {
          const listPayload = await loadList(view, filters, 1, query)
          if (listPayload) setList(listPayload)
        }
      } else {
        const payload = await readJson(await api('/api/pricing-calculator/sync/', { method: 'POST' }))
        setPricing((prev) => ({
          ...(prev || {}),
          sync: payload.sync,
          last_success: payload.sync,
          has_data: true,
        }))
        await loadPricingDash()
        await loadFilterOptions()
        if (view !== 'overview') {
          const listPayload = await loadList(view, filters, 1, query)
          if (listPayload) setList(listPayload)
        }
      }
    } catch (err) {
      setError(err.message === 'A sync is already running.' ? 'Refresh already running.' : err.message || 'Could not refresh right now.')
    } finally {
      setBusy(false)
    }
  }, [source, view, filters, query])

  const switchSource = useCallback(
    (next) => {
      if (next === source) return
      setFilters({})
      setSearch('')
      setQuery('')
      setList(null)
      setBoard(null)
      setDetail(null)
      setTrail([])
      setFilterOptions(null)
      setDash(null)
      pendingFiltersRef.current = null
      prevViewRef.current = 'overview'
      navigate(dashboardPath(next, 'overview'))
    },
    [source, navigate],
  )

  const openView = useCallback(
    (next, nextFilters = {}, { remember } = { remember: true }) => {
      if (next === view && Object.keys(nextFilters).length === 0) return

      if (remember) {
        setTrail((items) => [...items, { view, filters, search, detail }])
      } else {
        setTrail([])
      }

      const nextMap = { ...nextFilters }
      if (nextMap.division === undefined && filters.division) nextMap.division = filters.division

      // Same route: just apply filters (no view-change effect will run).
      if (next === view) {
        setFilters(nextMap)
        setList(null)
        setBoard(null)
        setDetail(null)
        return
      }

      // Apply filters only AFTER the route view updates (see view-change effect).
      // Updating filters here while URL is still the old tab caused double fetches.
      pendingFiltersRef.current = { view: next, filters: nextMap }
      navigate(dashboardPath(source, next))
    },
    [source, view, filters, search, detail, navigate],
  )

  const goBack = useCallback(() => {
    const prev = trail.at(-1)
    setTrail((items) => items.slice(0, -1))
    if (!prev) {
      setDetail(null)
      pendingFiltersRef.current = { view: 'overview', filters: {} }
      navigate(dashboardPath(source, 'overview'))
      return
    }
    pendingFiltersRef.current = {
      view: prev.view,
      filters: prev.filters || {},
    }
    setSearch(prev.search || '')
    setDetail(prev.detail || null)
    navigate(dashboardPath(source, prev.view))
  }, [trail, source, navigate])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (value === '' || value == null) delete next[key]
      else next[key] = value
      return next
    })
  }, [])

  const patchFilters = useCallback((updates) => {
    setFilters((prev) => {
      const next = { ...prev }
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value == null) delete next[key]
        else next[key] = value
      })
      return next
    })
  }, [])

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

  const value = useMemo(
    () => ({
      source,
      view,
      jobber,
      internal,
      pricing,
      dash,
      board,
      filters,
      filterOptions,
      search,
      setSearch,
      query,
      list,
      detail,
      trail,
      error,
      busy,
      connected,
      syncing,
      nav,
      title,
      updatedAt,
      showJobberConnect: source === 'jobber' && jobber && !connected,
      showInternalEmpty: source === 'internal' && internal && !internal.has_data && !dash,
      showPricingEmpty: source === 'pricing' && pricing && !pricing.has_data && !dash,
      ready: Boolean(jobber || internal || pricing),
      refresh,
      switchSource,
      openView,
      openDetail,
      goBack,
      setFilter,
      patchFilters,
      loadList: async (page) => {
        const payload = await loadList(view, filters, page, query)
        if (payload) setList(payload)
      },
    }),
    [
      source,
      view,
      jobber,
      internal,
      pricing,
      dash,
      board,
      filters,
      filterOptions,
      search,
      query,
      list,
      detail,
      trail,
      error,
      busy,
      connected,
      syncing,
      nav,
      title,
      updatedAt,
      refresh,
      switchSource,
      openView,
      openDetail,
      goBack,
      setFilter,
      patchFilters,
    ],
  )

  if (!SOURCES.has(source) || !viewValid) {
    return <Navigate to={dashboardPath('jobber', 'overview')} replace />
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
