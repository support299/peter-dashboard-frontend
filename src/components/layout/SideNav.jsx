import { SOURCE_SIDEBAR } from '../../config/navigation'
import { NavIcon } from './NavIcon'

export function SideNav({ source, items, view, onOpen }) {
  const meta = SOURCE_SIDEBAR[source] || SOURCE_SIDEBAR.jobber
  return (
    <aside className={`side-nav tone-${meta.tone}`}>
      <div className="side-nav-brand anim-rise" style={{ '--delay': '40ms' }}>
        <div className="side-nav-mark">{meta.title.slice(0, 1)}</div>
        <div>
          <strong>{meta.title}</strong>
          <span>{meta.subtitle}</span>
        </div>
      </div>
      <p className="side-nav-label anim-rise" style={{ '--delay': '90ms' }}>
        Navigate
      </p>
      <nav className="nav" aria-label={`${meta.title} sections`}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`side-nav-item anim-rise${view === item.id ? ' active' : ''}`}
            style={{ '--delay': `${120 + index * 45}ms` }}
            onClick={() => onOpen(item.id, {}, { remember: false })}
          >
            <span className="side-nav-icon">
              <NavIcon name={item.icon || item.id} />
            </span>
            <span className="side-nav-text">{item.label}</span>
            {view === item.id ? <span className="side-nav-pip" /> : null}
          </button>
        ))}
      </nav>
    </aside>
  )
}
