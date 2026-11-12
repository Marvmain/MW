import { useEffect, useState } from 'react'

// Milliseconds left until the given time (0 when passed). Ticks every second.
export function useCountdown(iso: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!iso) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [iso])

  return iso ? Math.max(0, new Date(iso).getTime() - now) : 0
}

export function formatRemaining(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}