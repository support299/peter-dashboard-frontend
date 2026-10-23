export const DIVISIONS = [
  { key: '', label: 'All divisions' },
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'specialized', label: 'Specialized Services' },
  { key: 'rentals', label: 'Equipment Rentals' },
]

export const STATUS_LABELS = {
  active: 'Active',
  paused: 'Paused',
  scheduled_resume: 'Scheduled to resume',
  cancelled: 'Cancelled',
}

export const CANCELLATION_REASONS = [
  { key: 'client_cancellation', label: 'Client cancellation', group: 'customer' },
  { key: 'client_unavailable', label: 'Client unavailable', group: 'customer' },
  { key: 'no_access', label: 'No access', group: 'customer' },
  { key: 'employee_absence', label: 'Employee absence', group: 'internal' },
  { key: 'company_scheduling', label: 'Company scheduling issue', group: 'internal' },
  { key: 'weather', label: 'Weather', group: 'external' },
  { key: 'rescheduled', label: 'Rescheduled', group: 'other' },
  { key: 'other', label: 'Other', group: 'other' },
]
