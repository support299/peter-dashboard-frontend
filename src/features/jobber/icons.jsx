export const JOBBER_KPI_META = {
  revenue: { tone: 'teal', hint: 'Invoice subtotals (ex tax)' },
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

export function RevenueIcon() {
  return (
    <svg className="jobber-hero-icon" viewBox="0 0 56 56" aria-hidden="true">
      <circle className="jh-ring" cx="28" cy="28" r="24" />
      <circle className="jh-coin" cx="28" cy="28" r="16" />
      <path className="jh-mark" d="M28 18v2.4c3 .3 5.2 1.9 5.2 4.5 0 2.8-2.3 4.1-5.6 4.7l-1.5.3c-1.8.3-2.7.9-2.7 2s1.1 1.9 2.8 1.9c2 0 3.2-.8 3.7-2l2.5 1.3c-1 2.2-3.2 3.5-5.9 3.8V40h-2.8v-2.3c-3.1-.3-5.4-2.1-5.4-4.8 0-3 2.4-4.4 5.8-5l1.5-.3c1.7-.3 2.5-.9 2.5-1.9s-.9-1.6-2.5-1.6c-1.6 0-2.7.7-3.2 1.8l-2.5-1.3c1-2.1 3.2-3.4 5.8-3.7V18H28z" />
    </svg>
  )
}

export function OutstandingIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="js-bg outstanding" x="8" y="10" width="24" height="20" rx="5" />
      <path className="js-mark" d="M14 17h12M14 22h8" />
      <circle className="js-dot" cx="28" cy="14" r="2.5" />
    </svg>
  )
}

export function ClientsIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg clients" cx="20" cy="15" r="6" />
      <path className="js-mark" d="M10 30c2.2-6 6-8.5 10-8.5S27.8 24 30 30" />
    </svg>
  )
}

export function MonthVisitsIcon() {
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

export function JobsIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="js-bg jobs" x="8" y="14" width="24" height="16" rx="3" />
      <path className="js-mark" d="M15 14v-2a5 5 0 0 1 10 0v2" />
    </svg>
  )
}

export function CompletedIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg completed" cx="20" cy="20" r="12" />
      <path className="js-mark" d="M13 20l4.5 4.5L27 15" />
    </svg>
  )
}

export function CancelledIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg cancelled" cx="20" cy="20" r="12" />
      <path className="js-mark" d="M14 14l12 12M26 14L14 26" />
    </svg>
  )
}

export function OneOffIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="js-bg oneoff" x="8" y="11" width="24" height="18" rx="4" />
      <path className="js-mark" d="M14 18h12M14 23h8" />
    </svg>
  )
}

export function RecurringIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <path className="js-bg recurring" d="M12 18a8 8 0 0 1 14-4" />
      <path className="js-mark" d="M26 10v4h-4M28 22a8 8 0 0 1-14 4M14 30v-4h4" />
    </svg>
  )
}

export function AvgPriceIcon() {
  return (
    <svg className="jobber-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="js-bg avg" cx="20" cy="20" r="12" />
      <path className="js-mark" d="M20 14v12M16 18h6c1.7 0 3 1 3 2.5S23.7 23 22 23h-6" />
    </svg>
  )
}

export const JOBBER_TOP_ICONS = {
  outstanding: OutstandingIcon,
  clients: ClientsIcon,
  visits: MonthVisitsIcon,
}

export const JOBBER_STRIP_ICONS = {
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
