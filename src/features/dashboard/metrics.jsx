import { useEffect, useState } from 'react'
import { money, number } from '../../lib'

export function formatKpi(kpi) {
  if (kpi.kind === 'currency') return money(kpi.value)
  if (kpi.kind === 'percent') return `${number(kpi.value)}%`
  return number(kpi.value)
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function AnimatedMetric({ kpi, delay = 0 }) {
  const reduced = usePrefersReducedMotion()
  const target = Number(kpi.value || 0)
  const [shown, setShown] = useState(reduced ? target : 0)

  useEffect(() => {
    if (reduced) {
      setShown(target)
      return undefined
    }
    let frame = 0
    const start = performance.now()
    const duration = 700
    const from = 0
    const tick = (now) => {
      const progress = Math.min(1, (now - start - delay) / duration)
      if (progress <= 0) {
        frame = requestAnimationFrame(tick)
        return
      }
      const eased = 1 - (1 - progress) ** 3
      setShown(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, delay, reduced])

  const display =
    kpi.kind === 'currency'
      ? money(shown)
      : kpi.kind === 'percent'
        ? `${number(Math.round(shown * 10) / 10)}%`
        : number(Math.round(shown))

  return <strong className="metric-value">{display}</strong>
}
