export const INTERNAL_KPI_META = {
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

export function TeamIcon() {
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

export function LeaveIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="is-bg leave" x="9" y="8" width="22" height="24" rx="5" />
      <path className="is-mark" d="M15 16h10M15 21h10M15 26h6" />
      <circle className="is-dot" cx="28" cy="12" r="3" />
    </svg>
  )
}

export function BonusIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg bonus" cx="20" cy="20" r="13" />
      <path className="is-mark" d="M20 13v14M15 18h10M15 23h10" />
    </svg>
  )
}

export function LockinIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="is-bg lockin" x="10" y="16" width="20" height="14" rx="3" />
      <path className="is-mark lock" d="M14 16v-3a6 6 0 0 1 12 0v3" />
      <circle className="is-dot" cx="20" cy="23" r="2" />
    </svg>
  )
}

export function RateIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg rate" cx="20" cy="20" r="12" />
      <path className="is-mark" d="M12 22l5 5 11-12" />
    </svg>
  )
}

export function PaidIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="is-bg paid" x="8" y="12" width="24" height="16" rx="4" />
      <circle className="is-dot" cx="20" cy="20" r="3.5" />
    </svg>
  )
}

export function VisitsIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <path className="is-bg visits" d="M20 8c-5 0-9 3.8-9 8.6 0 5.4 7.2 13.2 8.5 14.5a.7.7 0 0 0 1 0C21.8 29.8 29 22 29 16.6 29 11.8 25 8 20 8z" />
      <circle className="is-dot visits-core" cx="20" cy="16.5" r="3" />
    </svg>
  )
}

export function VacationIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg vacation" cx="20" cy="20" r="12" />
      <path className="is-mark" d="M20 12v8l5 3" />
    </svg>
  )
}

export const INTERNAL_TOP_ICONS = {
  leave_pending: LeaveIcon,
  bonus_total: BonusIcon,
  pending_lock_ins: LockinIcon,
}

export const INTERNAL_STRIP_ICONS = {
  leave_approval_rate: RateIcon,
  bonus_paid: PaidIcon,
  visits_total: VisitsIcon,
  vacation_pool: VacationIcon,
}

export function MrrActiveIcon() {
  return (
    <svg className="internal-hero-icon" viewBox="0 0 56 56" aria-hidden="true">
      <circle className="ih-ring" cx="28" cy="28" r="24" />
      <path className="is-mark mrr-wave" d="M14 34l8-10 6 5 10-14" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="38" cy="15" r="3" fill="#14b8a6" />
    </svg>
  )
}

export function MrrNewIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg bonus" cx="20" cy="20" r="13" />
      <path className="is-mark" d="M20 13v14M13 20h14" />
    </svg>
  )
}

export function MrrLostIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="is-bg lockin" cx="20" cy="20" r="13" />
      <path className="is-mark" d="M14 20h12M20 14v12" transform="rotate(45 20 20)" />
    </svg>
  )
}

export function MrrNetIcon() {
  return (
    <svg className="internal-stat-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect className="is-bg rate" x="8" y="10" width="24" height="20" rx="4" />
      <path className="is-mark" d="M13 24l5-6 4 3 5-7" fill="none" />
    </svg>
  )
}
