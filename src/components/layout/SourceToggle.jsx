export function SourceToggle({ source, onChange }) {
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
