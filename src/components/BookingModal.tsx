import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatVisitDate, todayInManila } from '../lib/dates'
import type { Activity, Cottage, ReservationResult } from '../types'
import Icon from './Icon'

const MOBILE_RE = /^(09|\+639)\d{9}$/

function peso(cents: number) {
  return '₱' + (cents / 100).toLocaleString('en-PH', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })
}

type Props = { cottage: Cottage; onClose: () => void; onBooked: () => void }

export default function BookingModal({ cottage, onClose, onBooked }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState('2')
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ReservationResult | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('activities')
      .select('*')
      .order('sort_order')
      .order('created_at')
      .then(({ data }) => {
        if (!cancelled && data) setActivities(data as Activity[])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const lines = activities.filter((a) => a.id in picked).map((a) => ({ a, qty: Number(picked[a.id]) }))
  const qtyOk = (q: number) => Number.isInteger(q) && q >= 1 && q <= 50
  const actsCents = lines.reduce((sum, l) => sum + (qtyOk(l.qty) ? Math.round(l.a.price * 100) * l.qty : 0), 0)
  const cottageCents = Math.round(cottage.price * 100)
  const totalCents = cottageCents + actsCents
  const downCents = Math.round(totalCents * 0.3)

  function toggle(a: Activity) {
    setPicked((p) => {
      const next = { ...p }
      if (a.id in next) delete next[a.id]
      else next[a.id] = '1'
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const cleanName = name.trim()
    const cleanPhone = phone.replace(/[\s-]/g, '')
    const guestCount = Number(guests)
    if (cleanName.length < 2 || cleanName.length > 100) return setError('Please enter your full name.')
    if (!MOBILE_RE.test(cleanPhone)) return setError('Please enter a valid mobile number, like 0917 123 4567.')
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) return setError('Number of guests must be between 1 and 50.')
    if (lines.some((l) => !qtyOk(l.qty))) return setError('Activity quantities must be whole numbers from 1 to 50.')

    setBusy(true)
    const { data, error: rpcError } = await supabase.rpc('create_reservation', {
      p_cottage_id: cottage.id,
      p_guest_name: cleanName,
      p_guest_phone: cleanPhone,
      p_guests: guestCount,
      p_activities: lines.map((l) => ({ activity_id: l.a.id, quantity: l.qty })),
    })
    setBusy(false)

    if (rpcError) {
      setError(rpcError.code === 'P0001' ? rpcError.message : 'Something went wrong. Please try again.')
      onBooked()
      return
    }
    setResult(data as ReservationResult)
    onBooked()
  }

  const inputClass = 'h-[43px] border border-[#d8d5cc] bg-white px-3 text-[13px] text-forest outline-none focus:border-[#30624d]'
  const labelClass = 'flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]'
  const title = `${cottage.name}${cottage.option ? ' · ' + cottage.option : ''}`

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[rgba(11,30,23,.72)] p-5" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <div className="relative max-h-[94vh] w-[min(700px,100%)] overflow-y-auto bg-paper p-[38px] shadow-[0_30px_80px_rgba(0,0,0,.25)] max-[640px]:px-[22px] max-[640px]:py-8">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[22px] top-[22px] border-0 bg-transparent text-[#546a61]">
          <Icon name="close" />
        </button>

        {result ? (
          <div className="px-5 pb-2.5 pt-6 text-center">
            <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#dfe9d7] text-green">
              <Icon name="check" size={30} />
            </span>
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage">Reservation received</span>
            <h2 id="booking-title" className="mb-3 text-[38px] font-bold leading-[1.14] tracking-[-.035em] text-forest max-[640px]:text-[30px]">
              Thank you, {name.trim().split(' ')[0]}.
            </h2>
            <p className="mx-auto max-w-[490px] text-sm leading-[1.7] text-[#687870]">
              Your cottage is held for you. Please send your 30% downpayment before the time below, or the hold will be released.
            </p>
            <div className="mx-auto my-[26px] flex flex-col gap-[5px] bg-[#eee9de] p-[18px]">
              <small className="text-[9px] uppercase tracking-[.15em] text-[#7e8883]">Reservation reference</small>
              <strong className="text-2xl tracking-[.08em] text-forest">{result.reference}</strong>
              <span className="flex items-center justify-center gap-[5px] text-[11px] text-[#9a642e]">
                <Icon name="clock" size={16} /> Held until{' '}
                {new Date(result.hold_expires_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })}
              </span>
            </div>
            <div className="mb-6 grid gap-1.5 bg-white p-4 text-left text-[12px] text-[#465e54]">
              <div className="flex justify-between"><span>Total</span><strong>{peso(Math.round(result.total * 100))}</strong></div>
              <div className="flex justify-between"><span>30% downpayment</span><strong>{peso(Math.round(result.downpayment * 100))}</strong></div>
              <div className="flex justify-between"><span>Balance on arrival</span><strong>{peso(Math.round(result.balance * 100))}</strong></div>
            </div>
            <p className="mb-6 text-[11px] text-[#7a857f]">Please save your reference number.</p>
            <button type="button" onClick={onClose} className="min-h-11 w-full rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage">Complete your reservation</span>
            <h2 id="booking-title" className="text-[38px] font-bold leading-[1.14] tracking-[-.035em] text-forest max-[640px]:text-[30px]">
              {title}
            </h2>
            <p className="mb-6 mt-1.5 text-[13px] text-[#728078]">Guest checkout — no account required.</p>

            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1 max-[640px]:gap-0">
              <label className={`${labelClass} mb-4`}>
                Full name
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} />
              </label>
              <label className={`${labelClass} mb-4`}>
                Mobile number
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" />
              </label>
              <div className={`${labelClass} mb-4`}>
                Visit date
                <div className={`${inputClass} flex items-center bg-[#f1eee6] font-semibold`}>Today · {formatVisitDate(todayInManila())}</div>
              </div>
              <label className={`${labelClass} mb-4`}>
                Guests
                <input className={inputClass} type="number" min={1} max={50} step={1} value={guests} onChange={(e) => setGuests(e.target.value)} />
              </label>
            </div>

            {activities.length > 0 && (
              <div className="mb-4">
                <span className={labelClass}>Optional activities</span>
                <div className="mt-[7px] border border-[#d8d5cc] bg-white">
                  {activities.map((a) => {
                    const on = a.id in picked
                    const note = [a.price_note, a.stock !== null ? 'Limited stock' : null].filter(Boolean).join('; ')
                    return (
                      <div key={a.id} className="flex items-center gap-3 border-b border-[#eeeae2] p-3 last:border-b-0">
                        <input type="checkbox" checked={on} onChange={() => toggle(a)} className="h-4 w-4 shrink-0" aria-label={`Add ${a.name}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-forest">
                            {a.name}
                            {a.option ? ` · ${a.option}` : ''}
                          </p>
                          {note && <p className="text-[11px] text-[#8a958f]">{note}</p>}
                        </div>
                        <span className="text-[12px] font-bold text-forest">{a.price === 0 ? 'Free' : `₱${a.price.toLocaleString()}`}</span>
                        {on && (
                          <input
                            type="number"
                            min={1}
                            max={50}
                            step={1}
                            value={picked[a.id]}
                            onChange={(e) => setPicked((p) => ({ ...p, [a.id]: e.target.value }))}
                            aria-label={`Quantity for ${a.name}`}
                            className="h-9 w-16 border border-[#d8d5cc] bg-white px-2 text-[13px] outline-none focus:border-[#30624d]"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mb-[18px] mt-1 grid gap-2 bg-[#eee9de] px-[18px] py-[15px] text-[12px] text-[#465e54]">
              <div className="flex justify-between"><span>Cottage rate</span><strong>{peso(cottageCents)}</strong></div>
              {actsCents > 0 && <div className="flex justify-between"><span>Activities</span><strong>{peso(actsCents)}</strong></div>}
              <div className="flex justify-between border-t border-[#d8d2c4] pt-2"><span>Total</span><strong>{peso(totalCents)}</strong></div>
              <div className="flex justify-between text-forest"><span className="font-bold">30% downpayment</span><strong className="text-[15px]">{peso(downCents)}</strong></div>
              <div className="flex justify-between"><span>Balance on arrival</span><strong>{peso(totalCents - downCents)}</strong></div>
              <p className="text-[10px] text-[#748079]">The final amounts are confirmed when you submit.</p>
            </div>

            {error && <p role="alert" className="mb-4 text-[12px] font-semibold text-[#ae673c]">{error}</p>}

            <button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-[9px] rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60">
              {busy ? 'Submitting…' : 'Submit reservation'} <Icon name="arrow" />
            </button>
            <p className="mt-3 text-center text-[10px] text-[#8a958f]">We only use your details to manage your reservation.</p>
          </form>
        )}
      </div>
    </div>
  )
}