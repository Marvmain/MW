import { useEffect, useRef, useState } from 'react'

// Shows a value and briefly highlights it whenever the value changes.
export default function Flash({ value, className = '' }: { value: string; className?: string }) {
  const previous = useRef(value)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (previous.current !== value) {
      previous.current = value
      setTick((t) => t + 1)
    }
  }, [value])

  return (
    <strong key={tick} className={`-mx-1 rounded-[3px] px-1 ${tick ? 'animate-flash' : ''} ${className}`}>
      {value}
    </strong>
  )
}