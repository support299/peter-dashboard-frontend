/** `allowed`: the sections this person may open (all when not given). */
export function SourceToggle({ source, onChange, showFinancials = false, allowed }) {
  const show = (src) => (allowed ? allowed.includes(src) : src !== 'financials' || showFinancials)
  return (
    <div className="source-toggle" role="tablist" aria-label="Dashboard source">
      {show('master') ? (
        <button type="button" role="tab" aria-selected={source === 'master'} className={source === 'master' ? 'active' : ''} onClick={() => onChange('master')}>
          Master
        </button>
      ) : null}
      {show('financials') ? (
        <button type="button" role="tab" aria-selected={source === 'financials'} className={source === 'financials' ? 'active' : ''} onClick={() => onChange('financials')}>
          Financials
        </button>
      ) : null}
      {show('jobber') ? (
        <button type="button" role="tab" aria-selected={source === 'jobber'} className={source === 'jobber' ? 'active' : ''} onClick={() => onChange('jobber')}>
          Jobber
        </button>
      ) : null}
      {show('internal') ? (
        <button type="button" role="tab" aria-selected={source === 'internal'} className={source === 'internal' ? 'active' : ''} onClick={() => onChange('internal')}>
          Internal App
        </button>
      ) : null}
      {show('pricing') ? (
        <button type="button" role="tab" aria-selected={source === 'pricing'} className={source === 'pricing' ? 'active' : ''} onClick={() => onChange('pricing')}>
          Pricing
        </button>
      ) : null}
    </div>
  )
}
