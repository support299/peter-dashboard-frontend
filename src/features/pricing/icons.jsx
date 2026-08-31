export const PRICING_KPI_META = {
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

export function MoneyIcon() {
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

export function QuotesIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="stat-icon-bg quotes" x="6" y="8" width="28" height="24" rx="6" />
      <path className="stat-icon-mark" d="M13 16h14M13 20h10M13 24h12" />
      <circle className="stat-icon-dot" cx="30" cy="12" r="3" />
    </svg>
  )
}

export function AvgIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="stat-icon-bg avg" cx="20" cy="20" r="13" />
      <path className="stat-icon-mark" d="M14 22c2.2 2.4 4.4 3.6 6 3.6s3.8-1.2 6-3.6" />
      <path className="stat-icon-mark" d="M20 13v8" />
      <circle className="stat-icon-dot" cx="20" cy="12" r="2.2" />
    </svg>
  )
}

export function PipelineIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="stat-icon-bg pipeline" x="7" y="18" width="7" height="12" rx="2" />
      <rect className="stat-icon-bg pipeline mid" x="16.5" y="13" width="7" height="17" rx="2" />
      <rect className="stat-icon-bg pipeline tall" x="26" y="8" width="7" height="22" rx="2" />
    </svg>
  )
}

export function ServicesIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="stat-icon-bg services" x="8" y="10" width="24" height="20" rx="5" />
      <path className="stat-icon-mark" d="M14 17h12M14 21h8M14 25h10" />
      <circle className="stat-icon-dot" cx="28" cy="14" r="2.4" />
    </svg>
  )
}

export function LocationsIcon() {
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

export function CouponsIcon() {
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

export function AddonsIcon() {
  return (
    <svg className="pricing-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="stat-icon-bg addons" cx="20" cy="20" r="12" />
      <path className="stat-icon-mark" d="M20 14v12M14 20h12" />
    </svg>
  )
}

export const TOP_STAT_ICONS = {
  submissions: QuotesIcon,
  avg_quote: AvgIcon,
  pipeline: PipelineIcon,
}

export const STRIP_STAT_ICONS = {
  services: ServicesIcon,
  locations: LocationsIcon,
  coupons: CouponsIcon,
  addons_revenue: AddonsIcon,
}
