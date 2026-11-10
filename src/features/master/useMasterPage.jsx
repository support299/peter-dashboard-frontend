import { useCallback, useState } from 'react'
import { DrillModal } from './DrillModal'
import { splitLabel } from './format'
import { PeriodBar } from './PeriodBar'
import { useComparisons, useInsights, usePeriod } from './periodState'

/** Period bar + loading/error + drill-down modal shared by every Master page. */
export function useMasterPage(path) {
  const result = useInsights(path)
  const { reload } = usePeriod()
  const [drill, setDrill] = useState(null)
  const openDrill = useCallback((metric, title, extra = {}) => setDrill({ metric, title, ...extra }), [])
  const comparisons = useComparisons(result.data)
  const shell = (children) => (
    <div className="master">
      <PeriodBar info={result.data} />
      {result.error ? <div className="notice">{result.error}</div> : null}
      {result.data && comparisons.length ? (
        <p className="period-note muted">
          <span className="period-note-long">
            Comparing with{' '}
            {comparisons.map(({ name, label }, index) => (
              <span key={name}>
                {index ? ' and ' : ''}
                <b>{name === 'previous' ? 'prev. period' : 'last year'}</b> ({label})
              </span>
            ))}
            .{result.data.period?.partial ? ' This period is still in progress, so each comparison covers the same number of days.' : ''}
          </span>
          <span className="period-note-short">vs {comparisons.map(({ label }) => splitLabel(label).dates || label).join(' · ')}</span>
        </p>
      ) : null}
      {!result.data && !result.error ? <p className="muted">Loading…</p> : null}
      {result.data ? children : null}
      {drill ? <DrillModal request={drill} onClose={() => setDrill(null)} onChanged={reload} /> : null}
    </div>
  )
  return { ...result, openDrill, comparisons, shell }
}
