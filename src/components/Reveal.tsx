import { useEffect, useRef, useState } from 'react'

// Fades an element up once it scrolls into view. Shows everything at once
// when the guest prefers reduced motion or the browser lacks IntersectionObserver.
function useReveal<T extends HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  delay = 0,
) {
  const [shown, setShown] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  })

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, shown])

  return {
    style: { transitionDelay: shown ? `${delay}ms` : '0ms' },
    className: `transition-[opacity,translate] duration-700 ease-out ${shown ? 'opacity-100' : 'translate-y-5 opacity-0'}`,
  }
}

export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reveal = useReveal(ref, delay)

  return (
    <div ref={ref} style={reveal.style} className={`${reveal.className} ${className}`}>
      {children}
    </div>
  )
}