import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatVisitDate } from '../lib/dates'
import { peso } from '../lib/money'
import type { TrackedReservation } from '../types'
import Icon from './Icon'
import PaymentStep from './PaymentStep'

const MOBILE_RE = /^(09|\+639)\d{9}$/

const STATUS: Record<TrackedReservation['status'], { label: string; cls: string }> = {
  pending_proof: { label: 'Waiting for payment proof', cls: 'bg-[#fff1dc] text-[#a6672f]' },
  expired: { label: 'Hold expired', cls: 'bg-[#eceeed] text-[#6f7d76]' },
  for_verification: { label: 'For verification', cls: 'bg-[#fff1dc] text-[#a6672f]' },
  confirmed: { label: 'Confirmed', cls: 'bg-[#e3eee4] text-[#2f694d]' },
  checked_in: { label: 'Checked in', cls: 'bg-[#e5edf2] text-[#45697d]' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#eceeed] text-[#6f7d76]' },
}

function statusMessage(r: TrackedReservation, holdTime: string) {
  switch (r.status) {
    case 'pending_proof':
      return `We are waiting for your payment proof. Please send your downpayment and upload the proof before ${holdTime}.`
    case 'expired':
      return 'The hold on this reservation has expired and the cottage was released. Please make a new reservation.'
    case 'for_verification':
      return 'We received your payment proof. Our staff will verify it and confirm your reservation.'
    case 'confirmed':
      return 'Your reservation is confirmed. Please present your reference number when you arrive.'
    case 'checked_in':
      return 'You have checked in. Enjoy your day by the river!'
    case 'cancelled':
      return 'This reservation was cancelled.'
  }
}

export default function TrackModal({ onClose }: { onClose: () => void }) {
  const [reference, setReference] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<TrackedReservation | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function lookup() {
    setBusy(true)
    setError('')
    const { data: res, error: rpcError } = await supabase.rpc('track_reservation', {
      p_reference: reference.trim(),
      p_phone: phone.replace(/[\s-]/g, ''),
    })
    setBusy(false)
    if (rpcError) {
      setError(rpcError.code === 'P0001' ? rpcError.message : 'Something went wrong. Please try again.')
      return
    }
    setData(res as TrackedReservation)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (reference.trim().length < 5) return setError('Please enter your reservation reference, like MW-3F9A1C.')
    if (!MOBILE_RE.test(phone.replace(/[\s-]/g, ''))) return setError('Please enter the mobile number you used for the reservation.')
    lookup()
  }

  const inputClass = 'h-[43px] border border-[#d8d5cc] bg-white px-3 text-[13px] text-forest outline-none focus:border-[#30624d]'
  const labelClass = 'flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]'
  const h2Class = 'text-[38px] font-bold leading-[1.14] tracking-[-.035em] text-forest max-[640px]:text-[30px]'
  const eyebrowClass = 'mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage'
  const primaryBtn =
    'inline-flex min-h-11 w-full items-center justify-center gap-[9px] rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60'

  const holdTime = data
    ? new Date(data.hold_expires_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })
    : ''

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[rgba(11,30,23,.72)] p-5" role="dialog" aria-modal="true" aria-labelledby="track-title">
      <div className="relative max-h-[94vh] w-[min(700px,100%)] overflow-y-auto bg-paper p-[38px] shadow-[0_30px_80px_rgba(0,0,0,.25)] max-[640px]:px-[22px] max-[640px]:py-8">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[22px] top-[22px] border-0 bg-transparent text-[#546a61]">
          <Icon name="close" />
        </button>

        {!data ? (
          <form onSubmit={submit} noValidate>
            <span className={eyebrowClass}>My booking</span>
            <h2 id="track-title" className={h2Class}>Track your reservation</h2>
            <p className="mb-6 mt-1.5 text-[13px] text-[#728078]">Enter your reference number and the mobile number you used when booking.</p>
            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1 max-[640px]:gap-0">
              <label className={`${labelClass} mb-4`}>
                Reservation reference
                <input className={`${inputClass} uppercase`} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="MW-3F9A1C" autoComplete="off" />
              </label>
              <label className={`${labelClass} mb-4`}>
                Mobile number
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" />
              </label>
            </div>
            {error && <p role="alert" className="mb-4 text-[12px] font-semibold text-[#ae673c]">{error}</p>}
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? 'Checking…' : 'Check my reservation'} <Icon name="search" />
            </button>
          </form>
        ) : (
          <div>
            <span className={eyebrowClass}>Your reservation</span>
            <h2 id="track-title" className={`${h2Class} tracking-[.04em]`}>{data.reference}</h2>
            <p className="mt-3">
              <span className={`inline-block rounded-full px-3 py-1.5 text-[10px] font-bold ${STATUS[data.status].cls}`}>{STATUS[data.status].label}</span>
            </p>
            <p className="mb-6 mt-4 text-sm leading-[1.7] text-[#687870]">{statusMessage(data, holdTime)}</p>

            <div className="mb-5 grid gap-1.5 bg-white p-4 text-[12px] text-[#465e54]">
              <div className="flex justify-between gap-4"><span>Name</span><strong className="text-right">{data.guest_name}</strong></div>
                {data.cottages.map((c) => (
                <div key={c.name + (c.option ?? '')} className="flex justify-between gap-4">
                  <span>{c.name}{c.option ? ` · ${c.option}` : ''} × {c.quantity}</span>
                  <strong>{peso(Math.round(c.line_total * 100))}</strong>
                </div>
              ))}
              <div className="flex justify-between gap-4"><span>Visit date</span><strong className="text-right">{formatVisitDate(data.visit_date)}</strong></div>
              <div className="flex justify-between gap-4"><span>Guests</span><strong>{data.guests_count}</strong></div>
              {data.activities.map((a) => (
                <div key={a.name + (a.option ?? '')} className="flex justify-between gap-4">
                  <span>{a.name}{a.option ? ` · ${a.option}` : ''} × {a.quantity}</span>
                  <strong>{a.line_total === 0 ? 'Free' : peso(Math.round(a.line_total * 100))}</strong>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-[#eeeae2] pt-2"><span>Total</span><strong>{peso(Math.round(data.total * 100))}</strong></div>
              <div className="flex justify-between text-forest"><span className="font-bold">30% downpayment</span><strong>{peso(Math.round(data.downpayment * 100))}</strong></div>
              <div className="flex justify-between"><span>Balance on arrival</span><strong>{peso(Math.round(data.balance * 100))}</strong></div>
            </div>

            {data.can_upload && data.reservation_id && (
              <div className="mb-5">
                <PaymentStep reservationId={data.reservation_id} downpayment={data.downpayment} holdTime={holdTime} onUploaded={lookup} />
              </div>
            )}

            <div className="flex gap-3 max-[640px]:flex-col">
              <button type="button" onClick={() => { setData(null); setError('') }} className="min-h-11 flex-1 rounded-[3px] border border-[#d7ddd8] bg-white text-[13px] font-bold text-[#466158]">
                Check another reservation
              </button>
              <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-[3px] bg-green text-[13px] font-bold text-white hover:brightness-105">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}