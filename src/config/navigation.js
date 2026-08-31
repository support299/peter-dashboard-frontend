export const JOBBER_LIST_FILTERS = {
  visits: {
    search: true,
    dates: true,
    division: true,
    employee: true,
    teamLeader: true,
    serviceType: true,
    city: true,
  },
  jobs: {
    search: true,
    dates: true,
    division: true,
    employee: true,
    serviceType: true,
    city: true,
    source: true,
  },
  clients: { search: true },
  invoices: { search: true, dates: true },
}

export const JOBBER_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'oneoff', label: 'One-Off', icon: 'oneoff' },
  { id: 'cancellations', label: 'Cancellations', icon: 'cancellations' },
  { id: 'cx', label: 'Experience', icon: 'cx' },
  { id: 'visits', label: 'Visits', icon: 'visits' },
  { id: 'jobs', label: 'Jobs', icon: 'jobs' },
  { id: 'clients', label: 'Customers', icon: 'clients' },
  { id: 'invoices', label: 'Invoices', icon: 'invoices' },
  { id: 'mappings', label: 'Mappings', icon: 'mappings' },
]

export const JOBBER_BOARD_VIEWS = new Set(['oneoff', 'cancellations', 'cx'])
export const JOBBER_SPECIAL_VIEWS = new Set(['oneoff', 'cancellations', 'cx', 'mappings'])

export const INTERNAL_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'employees', label: 'Employees', icon: 'employees' },
  { id: 'leave', label: 'Leave', icon: 'leave' },
  { id: 'bonuses', label: 'Bonuses', icon: 'bonuses' },
  { id: 'lockins', label: 'Lock-ins', icon: 'lockins' },
]

export const PRICING_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'submissions', label: 'Quotes', icon: 'quotes' },
  { id: 'services', label: 'Services', icon: 'services' },
  { id: 'packages', label: 'Packages', icon: 'packages' },
  { id: 'locations', label: 'Locations', icon: 'locations' },
  { id: 'coupons', label: 'Coupons', icon: 'coupons' },
  { id: 'addons', label: 'Add-ons', icon: 'addons' },
]

export const SOURCE_SIDEBAR = {
  jobber: { title: 'Jobber', subtitle: 'Operations', tone: 'teal' },
  internal: { title: 'Internal', subtitle: 'Contractor hub', tone: 'teal' },
  pricing: { title: 'Pricing', subtitle: 'Quote engine', tone: 'cyan' },
}

export const JOBBER_LIST_PATH = {
  visits: '/api/operations/visits/',
  jobs: '/api/operations/jobs/',
  clients: '/api/operations/clients/',
  invoices: '/api/operations/invoices/',
}

export const INTERNAL_LIST_PATH = {
  employees: '/api/admin-internal/employees/',
  leave: '/api/admin-internal/leave/',
  bonuses: '/api/admin-internal/bonuses/',
  lockins: '/api/admin-internal/lockins/',
  visits: '/api/admin-internal/visits/',
}

export const PRICING_LIST_PATH = {
  submissions: '/api/pricing-calculator/submissions/',
  services: '/api/pricing-calculator/services/',
  packages: '/api/pricing-calculator/packages/',
  locations: '/api/pricing-calculator/locations/',
  coupons: '/api/pricing-calculator/coupons/',
  addons: '/api/pricing-calculator/addons/',
}
