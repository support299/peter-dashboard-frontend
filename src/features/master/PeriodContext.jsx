import { useCallback, useEffect, useMemo, useState } from 'react'
import { PeriodContext } from './periodState'

const STORAGE_KEY = 'master-period'

function todayIso() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Default view (client decision): current month vs previous month and the same month last year.
const DEFAULTS = { kind: 'month', anchor: '', from: '', to: '', compare: 'both', division: '' }

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function PeriodProvider({ children }) {
  const [state, setState] = useState(readStored)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage unavailable (private window): the period just isn't remembered.
    }
  }, [state])

  const update = useCallback((patch) => setState((prev) => ({ ...prev, ...patch })), [])
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const params = useMemo(() => {
    if (state.kind === 'custom') {
      return { period: 'custom', from: state.from || todayIso(), to: state.to || todayIso(), division: state.division }
    }
    return { period: state.kind, anchor: state.anchor, division: state.division }
  }, [state])

  const value = useMemo(() => ({ state, update, params, version, reload }), [state, update, params, version, reload])
  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}
