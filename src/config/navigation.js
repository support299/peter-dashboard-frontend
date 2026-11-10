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
  { id: 'mrr', label: 'MRR', icon: 'mrr' },
  { id: 'mappings', label: 'Mappings', icon: 'mappings' },
]

export const JOBBER_BOARD_VIEWS = new Set(['oneoff', 'cancellations', 'cx'])
export const JOBBER_SPECIAL_VIEWS = new Set(['oneoff', 'cancellations', 'cx', 'mappings', 'mrr'])

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

export const MASTER_NAV = [
  { id: 'overview', label: 'CEO view', icon: 'overview' },
  { id: 'manager', label: 'Manager overview', icon: 'employees' },
  { id: 'revenue', label: 'Revenue', icon: 'invoices' },
  { id: 'clients', label: 'Clients & growth', icon: 'clients' },
  { id: 'mrr', label: 'MRR', icon: 'mrr' },
  { id: 'sales', label: 'Sales & leads', icon: 'quotes' },
  { id: 'cancellations', label: 'Cancellations', icon: 'cancellations' },
  { id: 'operations', label: 'Operations', icon: 'visits' },
  { id: 'quality', label: 'Quality', icon: 'cx' },
  { id: 'alerts', label: 'Alerts', icon: 'lockins' },
  { id: 'rules', label: 'Revenue rules', icon: 'mappings', staff: true },
]

/** `min`: lowest Financials role that sees the page (entry < full < admin). */
export const FINANCIALS_NAV = [
  { id: 'expenses', label: 'Expenses', icon: 'invoices', min: 'full' },
  { id: 'entries', label: 'Expense entries', icon: 'jobs', min: 'entry' },
  { id: 'payroll', label: 'Payroll', icon: 'employees', min: 'full' },
  { id: 'contractor-pay', label: 'Contractor pay', icon: 'bonuses', min: 'full' },
  { id: 'recurring', label: 'Recurring', icon: 'mrr', min: 'full' },
  { id: 'totals', label: 'Monthly totals & import', icon: 'mappings', min: 'full' },
  { id: 'pnl', label: 'Profit & Loss', icon: 'overview', min: 'full' },
  { id: 'cash', label: 'Cash & Debt', icon: 'bonuses', min: 'full' },
  { id: 'reports', label: 'Reports', icon: 'visits', min: 'full' },
  { id: 'review', label: 'Month review', icon: 'lockins', min: 'full' },
  { id: 'settings', label: 'Categories & access', icon: 'services', min: 'full' },
]

export const FINANCE_RANK = { '': 0, entry: 1, full: 2, admin: 3 }

export function financialsNav(role) {
  return FINANCIALS_NAV.filter((item) => FINANCE_RANK[role || ''] >= FINANCE_RANK[item.min])
}

export const SOURCE_SIDEBAR = {
  master: { title: 'Master', subtitle: 'Management view', tone: 'teal' },
  financials: { title: 'Financials', subtitle: 'Expenses & profit', tone: 'teal' },
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
