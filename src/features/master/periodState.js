import { createContext, useContext, useEffect, useState } from 'react'
import { api, queryString, readJson } from '../../lib'

export const PeriodContext = createContext(null)

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider')
  return ctx
}

/**
 * GET a JSON endpoint and keep the last response. `loading` is true while the
 * response on screen belongs to a different URL than the one requested.
 */
export function useFetch(url, version = 0) {
  const [result, setResult] = useState({ key: null, data: null, error: '' })
  const key = `${url}#${version}`

  useEffect(() => {
    let cancelled = false
    api(url)
      .then(readJson)
      .then((data) => !cancelled && setResult({ key, data, error: '' }))
      .catch((err) => !cancelled && setResult((prev) => ({ key, data: prev.data, error: err.message })))
    return () => {
      cancelled = true
    }
  }, [url, key])

  return { data: result.data, error: result.key === key ? result.error : '', loading: result.key !== key }
}

/** Fetch a Master Dashboard endpoint for the current period; re-fetches when the period changes. */
export function useInsights(path, extra = {}) {
  const { params, version } = usePeriod()
  return useFetch(`${path}${queryString({ ...params, ...extra })}`, version)
}

/** Which comparison periods to show, per the "Compare with" choice. */
export function useComparisons(info) {
  const { state } = usePeriod()
  const comps = info?.comparisons || {}
  const names = state.compare === 'both' ? ['previous', 'last_year'] : state.compare === 'none' ? [] : [state.compare]
  return names.filter((name) => comps[name]).map((name) => ({ name, label: comps[name].label }))
}
