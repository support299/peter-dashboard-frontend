export function NavIcon({ name }) {
  switch (name) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      )
    case 'visits':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3h8v3H8zM5 6h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" />
          <path d="M8 11h8M8 15h5" />
        </svg>
      )
    case 'jobs':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <rect x="3" y="7" width="18" height="13" rx="2" />
        </svg>
      )
    case 'clients':
    case 'employees':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19c1.8-3.8 4.2-5.5 7-5.5s5.2 1.7 7 5.5" />
        </svg>
      )
    case 'invoices':
    case 'quotes':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M15 3v4h4M8 12h8M8 16h6" />
        </svg>
      )
    case 'leave':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4" />
        </svg>
      )
    case 'bonuses':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M9.5 10.5h5M9.5 13.5h5" />
        </svg>
      )
    case 'lockins':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      )
    case 'services':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16v12H4z" />
          <path d="M8 7V5h8v2M8 12h8M8 16h5" />
        </svg>
      )
    case 'packages':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 8l9-4 9 4-9 4-9-4z" />
          <path d="M3 8v8l9 4 9-4V8" />
          <path d="M12 12v8" />
        </svg>
      )
    case 'locations':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    case 'coupons':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9a2.5 2.5 0 0 0 0 5v2.5A1.5 1.5 0 0 0 4.5 18h15a1.5 1.5 0 0 0 1.5-1.5V14a2.5 2.5 0 0 0 0-5V7.5A1.5 1.5 0 0 0 19.5 6h-15A1.5 1.5 0 0 0 3 7.5V9z" />
          <path d="M14 8v8" />
        </svg>
      )
    case 'addons':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )
    case 'oneoff':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h11l5 5v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
          <path d="M14 7v5h5M8 13h4M8 16h6" />
        </svg>
      )
    case 'cancellations':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      )
    case 'cx':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l2.2 4.5L19 8.5l-3.5 3.4.8 4.8L12 14.8 7.7 16.7l.8-4.8L5 8.5l4.8-1L12 3z" />
        </svg>
      )
    case 'mappings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="8" cy="6" r="1.6" />
          <circle cx="14" cy="12" r="1.6" />
          <circle cx="10" cy="18" r="1.6" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
        </svg>
      )
  }
}
