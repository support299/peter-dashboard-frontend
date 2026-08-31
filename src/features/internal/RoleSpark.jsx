export function RoleSpark({ data = [] }) {
  const values = data.map((item) => Number(item.count || item.value || 0))
  if (!values.length) return <div className="internal-spark empty" />
  const max = Math.max(...values, 1)
  const width = 160
  const height = 48
  const barW = Math.max(10, (width - (values.length - 1) * 6) / values.length)
  return (
    <svg className="internal-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {values.map((value, index) => {
        const h = Math.max(4, (value / max) * (height - 6))
        const x = index * (barW + 6)
        return <rect key={index} className="internal-spark-bar" x={x} y={height - h} width={barW} height={h} rx="4" />
      })}
    </svg>
  )
}
