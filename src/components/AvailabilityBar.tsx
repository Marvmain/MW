import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatVisitDate, todayInManila } from '../lib/dates'
import type { AvailabilityResult, CottageAvailability } from '../types'
import Icon from './Icon'

export default function AvailabilityBar({ onResult }: { onResult: (r: AvailabilityResult | null) => void }) {
  const [today, setToday] = useState(todayInManila())
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)

  const check = useCallback(
    async (scroll: boolean) => {
      const date = todayInManila()
      setToday(date)
      setError('')
      setSummary('')
      setBusy(true)
      const { data, error: rpcError } = await supabase.rpc('get_cottage_availability', { p_date: date })
      setBusy(false)

      if (rpcError) {
        onResult(null)
        setError('We could not check availability. Please try again.')
        return
      }

      const rows = (data ?? []) as CottageAvailability[]
      onResult({ date, rows })
      if (rows.length === 0) {
        setSummary('No cottages are listed yet.')
      } else {
        const free = rows.filter((r) => r.remaining > 0).length
        setSummary(`Today: ${free} of ${rows.length} cottage ${rows.length === 1 ? 'type is' : 'types are'} available.`)
      }
      if (scroll) document.querySelector('#cottages')?.scrollIntoView({ behavior: 'smooth' })
    },
    [onResult],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void check(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [check])

  return (
    <section className="relative z-[3] -mt-[35px] px-[clamp(24px,8vw,124px)] max-[640px]:-mt-7 max-[640px]:px-4">
      <div className="mx-auto grid max-w-[760px] grid-cols-[1fr_auto] items-end bg-white p-[18px] shadow-[0_12px_36px_rgba(31,54,44,.12)] max-[640px]:grid-cols-1 max-[640px]:p-4">
        <div className="border-r border-[#e4e1d9] px-6 max-[640px]:border-0 max-[640px]:border-b max-[640px]:px-1 max-[640px]:py-2.5">
          <span className="mb-[5px] flex items-center gap-2 text-[11px] font-bold text-[#486158]">
            <Icon name="calendar" /> Visit date
          </span>
          <p className="py-1.5 text-sm font-semibold text-forest">Today · {formatVisitDate(today)}</p>
          <p className="text-[10px] text-[#8a958f]">Reservations are for today only.</p>
        </div>
        <button
          type="button"
          onClick={() => check(true)}
          disabled={busy}
          className="ml-[18px] inline-flex min-h-[54px] items-center justify-center gap-[9px] rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:-translate-y-px hover:brightness-105 disabled:opacity-60 max-[640px]:ml-0 max-[640px]:mt-4"
        >
          <Icon name="search" /> {busy ? 'Checking…' : 'Check availability'}
        </button>
      </div>
      {(error || summary) && (
        <p role="status" className={`mx-auto mt-3 max-w-[760px] text-[12px] font-semibold ${error ? 'text-[#ae673c]' : 'text-[#2f694d]'}`}>
          {error || summary}
        </p>
      )}
    </section>
  )
}