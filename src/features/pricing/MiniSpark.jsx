export function MiniSpark({ data = [] }) {
  const values = data.map((item) => Number(item.value || 0))
  if (!values.length) {
    return <div className="pricing-spark empty" />
  }
  const max = Math.max(...values, 1)
  const width = 160
  const height = 48
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = height - (value / max) * (height - 8) - 4
      return `${x},${y}`
    })
    .join(' ')
  const area = `0,${height} ${points} ${width},${height}`

  return (
    <svg className="pricing-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline className="pricing-spark-area" points={area} />
      <polyline className="pricing-spark-line" points={points} />
    </svg>
  )
}
