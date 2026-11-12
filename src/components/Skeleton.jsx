import '../styles/skeleton.css'

/*
 * Grey placeholder shapes shown while a page loads, in the shape of what's coming, instead of a
 * "Loading…" line. Screen readers hear "Loading" once; the shapes themselves are hidden from them.
 */

export function Bone({ width = '100%', height = 12, radius = 6, style }) {
  return <span className="sk-bone" style={{ width, height, borderRadius: radius, ...style }} />
}

function Loading({ className = '', children, label = 'Loading' }) {
  return (
    <div className={`sk ${className}`} role="status" aria-live="polite" aria-busy="true">
      <span className="sk-sr">{label}…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

function CardShape() {
  return (
    <div className="sk-card">
      <Bone width="45%" height={11} />
      <Bone width="60%" height={26} radius={8} />
      <Bone width="70%" height={10} />
    </div>
  )
}

export function SkeletonCards({ count = 6, columns = 3 }) {
  return (
    <Loading>
      <div className="sk-cards" style={{ '--sk-cols': columns }}>
        {Array.from({ length: count }, (_, i) => (
          <CardShape key={i} />
        ))}
      </div>
    </Loading>
  )
}

function ChartShape({ bars = 12 }) {
  // Fixed, varied heights so it reads as a chart, not a block.
  const heights = [45, 60, 52, 70, 64, 80, 58, 75, 68, 85, 62, 78]
  return (
    <div className="sk-chart">
      <Bone width="40%" height={13} />
      <div className="sk-bars">
        {Array.from({ length: bars }, (_, i) => (
          <span key={i} className="sk-bone sk-bar" style={{ height: `${heights[i % heights.length]}%` }} />
        ))}
      </div>
      <Bone width="55%" height={10} />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <Loading>
      <ChartShape />
    </Loading>
  )
}

export function SkeletonCharts({ count = 6 }) {
  return (
    <Loading>
      <div className="sk-charts">
        {Array.from({ length: count }, (_, i) => (
          <ChartShape key={i} />
        ))}
      </div>
    </Loading>
  )
}

export function SkeletonTable({ rows = 8, columns = 5 }) {
  return (
    <Loading>
      <div className="sk-table">
        <div className="sk-row sk-head">
          {Array.from({ length: columns }, (_, c) => (
            <span key={c} className="sk-cell">
              <Bone width={c === 0 ? '70%' : '55%'} height={10} />
            </span>
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="sk-row">
            {Array.from({ length: columns }, (_, c) => (
              <span key={c} className="sk-cell">
                <Bone width={`${50 + ((r * 7 + c * 13) % 40)}%`} height={12} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </Loading>
  )
}

/** A dashboard page: a row of cards, then two panels. */
export function SkeletonPage() {
  return (
    <Loading className="sk-page">
      <SkeletonPageShapes />
    </Loading>
  )
}

/** The whole app frame while signing in is checked: top bar, side menu and a page. */
export function SkeletonApp() {
  return (
    <Loading className="sk-app">
      <div className="sk-topbar">
        <Bone width={150} height={30} radius={10} />
        <Bone width={320} height={36} radius={999} />
        <Bone width={180} height={36} radius={12} />
      </div>
      <div className="sk-body">
        <div className="sk-side">
          <Bone height={52} radius={14} />
          {Array.from({ length: 7 }, (_, i) => (
            <Bone key={i} height={34} radius={10} />
          ))}
        </div>
        <div className="sk-main">
          <Bone width="28%" height={28} radius={8} />
          <Bone width="45%" height={12} />
          <SkeletonPageShapes />
        </div>
      </div>
    </Loading>
  )
}

function SkeletonPageShapes() {
  return (
    <>
      <div className="sk-panel">
        <div className="sk-cards" style={{ '--sk-cols': 3 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <CardShape key={i} />
          ))}
        </div>
      </div>
      <div className="sk-split">
        <div className="sk-panel">
          <ChartShape />
        </div>
        <div className="sk-panel">
          <ChartShape />
        </div>
      </div>
    </>
  )
}
