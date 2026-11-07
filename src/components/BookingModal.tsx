import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatVisitDate, todayInManila } from '../lib/dates'
import { checkProof, submitPaymentProof } from '../lib/proofs'
import { peso } from '../lib/money'
import type { Activity, AvailabilityResult, Cottage, PaymentMethod, ReservationResult } from '../types'
import Icon from './Icon'

const MOBILE_RE = /^(09|\+639)\d{9}$/

function Progress({ step }: { step: 1 | 2 | 3 }) {
  const items = ['1. Details', '2. Payment proof', '3. Confirmation']
  return (
    <div className="my-7 grid grid-cols-3 border-b border-[#d8d3ca]">
      {items.map((label, i) => (
        <span
          key={label}
          className={`pb-2.5 text-[10px] font-bold max-[640px]:text-[8px] ${step === i + 1 ? 'border-b-2 border-[#235440] text-[#235440]' : 'text-[#9aa39f]'}`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

type Props = {
  cottages: Cottage[]
  initialId: string
  availability: AvailabilityResult | null
  onClose: () => void
  onBooked: () => void
}

export default function BookingModal({ cottages, initialId, availability, onClose, onBooked }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState('2')
  const [pickedCottages, setPickedCottages] = useState<Record<string, string>>(() => ({ [initialId]: '1' }))
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploaded, setUploaded] = useState(false)
  const [copied, setCopied] = useState('')

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
    if (!result) return
    let cancelled = false
    supabase
      .from('payment_methods')
      .select('*')
      .order('sort_order')
      .order('created_at')
      .then(({ data }) => {
        if (!cancelled && data) setMethods(data as PaymentMethod[])
      })
    return () => {
      cancelled = true
    }
  }, [result])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // How many of each cottage are still free today
  const slotById = new Map((availability?.rows ?? []).map((r) => [r.cottage_id, r]))
  const maxFor = (c: Cottage) => Math.min(20, slotById.get(c.id)?.remaining ?? c.units)

  const cottageLines = cottages.filter((c) => c.id in pickedCottages).map((c) => ({ c, qty: Number(pickedCottages[c.id]) }))
  const cottageQtyOk = (c: Cottage, q: number) => Number.isInteger(q) && q >= 1 && q <= maxFor(c)
  const cottageCents = cottageLines.reduce(
    (sum, l) => sum + (cottageQtyOk(l.c, l.qty) ? Math.round(l.c.price * 100) * l.qty : 0),
    0,
  )

  const lines = activities.filter((a) => a.id in picked).map((a) => ({ a, qty: Number(picked[a.id]) }))
  const qtyOk = (q: number) => Number.isInteger(q) && q >= 1 && q <= 50
  const actsCents = lines.reduce((sum, l) => sum + (qtyOk(l.qty) ? Math.round(l.a.price * 100) * l.qty : 0), 0)

  const totalCents = cottageCents + actsCents
  const downCents = Math.round(totalCents * 0.3)

  function toggleCottage(c: Cottage) {
    setPickedCottages((p) => {
      const next = { ...p }
      if (c.id in next) delete next[c.id]
      else next[c.id] = '1'
      return next
    })
  }

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
    if (cottageLines.length === 0) return setError('Please choose at least one cottage.')
    if (cottageLines.some((l) => !cottageQtyOk(l.c, l.qty)))
      return setError('Please check the number of cottages. It must be a whole number within what is still available.')
    if (cleanName.length < 2 || cleanName.length > 100) return setError('Please enter your full name.')
    if (!MOBILE_RE.test(cleanPhone)) return setError('Please enter a valid mobile number, like 0917 123 4567.')
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) return setError('Number of guests must be between 1 and 50.')
    if (lines.some((l) => !qtyOk(l.qty))) return setError('Activity quantities must be whole numbers from 1 to 50.')

    setBusy(true)
    const { data, error: rpcError } = await supabase.rpc('create_reservation', {
      p_cottages: cottageLines.map((l) => ({ cottage_id: l.c.id, quantity: l.qty })),
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

  function onPickFile(f: File | null) {
    setFile(f)
    setUploadError(f ? checkProof(f) ?? '' : '')
  }

  async function sendProof(e: React.FormEvent) {
    e.preventDefault()
    if (!result || !file) return
    const problem = checkProof(file)
    if (problem) return setUploadError(problem)
    setUploading(true)
    setUploadError('')
    try {
      await submitPaymentProof(result.reservation_id, file)
      setUploaded(true)
    } catch (err) {
      setUploadError((err as Error).message)
    }
    setUploading(false)
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      /* clipboard not available */
    }
  }

  const inputClass = 'h-[43px] border border-[#d8d5cc] bg-white px-3 text-[13px] text-forest outline-none focus:border-[#30624d]'
  const labelClass = 'flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]'
  const qtyClass = 'h-9 w-16 border border-[#d8d5cc] bg-white px-2 text-[13px] outline-none focus:border-[#30624d]'
  const firstName = name.trim().split(' ')[0]
  const holdTime = result
    ? new Date(result.hold_expires_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })
    : ''
  const h2Class = 'text-[38px] font-bold leading-[1.14] tracking-[-.035em] text-forest max-[640px]:text-[30px]'
  const eyebrowClass = 'mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage'
  const primaryBtn =
    'inline-flex min-h-11 w-full items-center justify-center gap-[9px] rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60'

  const referenceBox = result && (
    <div className="my-[22px] flex flex-col gap-[5px] bg-[#eee9de] p-[18px] text-center">
      <small className="text-[9px] uppercase tracking-[.15em] text-[#7e8883]">Reservation reference</small>
      <strong className="text-2xl tracking-[.08em] text-forest">{result.reference}</strong>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[rgba(11,30,23,.72)] p-5" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <div className="relative max-h-[94vh] w-[min(700px,100%)] overflow-y-auto bg-paper p-[38px] shadow-[0_30px_80px_rgba(0,0,0,.25)] max-[640px]:px-[22px] max-[640px]:py-8">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[22px] top-[22px] border-0 bg-transparent text-[#546a61]">
          <Icon name="close" />
        </button>

        {/* STEP 3: confirmation */}
        {result && uploaded && (
          <div className="text-center">
            <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#dfe9d7] text-green">
              <Icon name="check" size={30} />
            </span>
            <span className={eyebrowClass}>Payment proof received</span>
            <h2 id="booking-title" className={`${h2Class} mb-3`}>Thank you, {firstName}.</h2>
            <Progress step={3} />
            <p className="mx-auto max-w-[490px] text-sm leading-[1.7] text-[#687870]">
              Our staff will verify your payment and confirm your reservation. Your QR code is issued once it is confirmed.
            </p>
            {referenceBox}
            <p className="mb-6 flex items-center justify-center gap-[5px] text-[11px] text-[#9a642e]">
              <Icon name="clock" size={16} /> Status: For verification
            </p>
            <p className="mb-6 text-[11px] text-[#7a857f]">
              Please save your reference number. You can check your status any time with “My booking” at the top of the page.
            </p>
            <button type="button" onClick={onClose} className={primaryBtn}>Done</button>
          </div>
        )}

        {/* STEP 2: payment proof */}
        {result && !uploaded && (
          <div>
            <span className={eyebrowClass}>Reservation received</span>
            <h2 id="booking-title" className={h2Class}>Almost done, {firstName}.</h2>
            <p className="mt-1.5 text-[13px] text-[#728078]">
              Send your downpayment, then upload the proof before <strong>{holdTime}</strong> or the hold is released.
            </p>
            <Progress step={2} />

            {referenceBox}

            <div className="mb-5 grid gap-1.5 bg-white p-4 text-[12px] text-[#465e54]">
              <div className="flex justify-between"><span>Total</span><strong>{peso(Math.round(result.total * 100))}</strong></div>
              <div className="flex justify-between text-forest"><span className="font-bold">Please send (30% downpayment)</span><strong className="text-[15px]">{peso(Math.round(result.downpayment * 100))}</strong></div>
              <div className="flex justify-between"><span>Balance on arrival</span><strong>{peso(Math.round(result.balance * 100))}</strong></div>
            </div>

            <div className="mb-5">
              <span className={labelClass}>How to pay</span>
              {methods.length === 0 ? (
                <p className="mt-[7px] border border-[#d8d5cc] bg-white p-3 text-[12px] text-[#728078]">
                  Payment details are not available right now. Please contact the resort to get them, then upload your proof here.
                </p>
              ) : (
                <div className="mt-[7px] grid gap-2">
                  {methods.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 border border-[#d8d5cc] bg-white p-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-forest">{m.label}</p>
                        <p className="text-[12px] text-[#728078]">{m.account_name}</p>
                        <p className="text-[13px] font-semibold tracking-[.04em] text-forest">{m.account_number}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copy(m.account_number)}
                        className="h-[33px] shrink-0 rounded-[3px] border border-[#d7ddd8] bg-white px-3 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3]"
                      >
                        {copied === m.account_number ? 'Copied' : 'Copy number'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={sendProof} noValidate>
              <label className="relative flex cursor-pointer items-center gap-3 border border-dashed border-[#aab5ae] bg-white p-4 focus-within:border-[#30624d]">
                <Icon name="upload" />
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <strong className="text-[12px] text-[#465e54]">{file ? file.name : 'Upload your payment proof'}</strong>
                  <small className="text-[11px] text-[#8b9690]">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'JPG, PNG, WebP or PDF · up to 5 MB'}
                  </small>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  aria-label="Payment proof"
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              {uploadError && <p role="alert" className="mt-3 text-[12px] font-semibold text-[#ae673c]">{uploadError}</p>}
              <button type="submit" disabled={!file || uploading || !!uploadError} className={`${primaryBtn} mt-4`}>
                {uploading ? 'Uploading…' : 'Submit payment proof'} <Icon name="arrow" />
              </button>
              <p className="mt-3 text-center text-[10px] text-[#8a958f]">Keep this window open until your proof is uploaded.</p>
            </form>
          </div>
        )}

        {/* STEP 1: details */}
        {!result && (
          <form onSubmit={submit} noValidate>
            <span className={eyebrowClass}>Complete your reservation</span>
            <h2 id="booking-title" className={h2Class}>Your reservation</h2>
            <p className="mt-1.5 text-[13px] text-[#728078]">Guest checkout — no account required.</p>
            <Progress step={1} />

            <div className="mb-5">
              <span className={labelClass}>Cottages (you can add more than one)</span>
              <div className="mt-[7px] border border-[#d8d5cc] bg-white">
                {cottages.map((c) => {
                  const on = c.id in pickedCottages
                  const slot = slotById.get(c.id)
                  const max = maxFor(c)
                  const full = slot ? slot.remaining <= 0 : false
                  const left = slot && c.units > 1 ? ` · ${slot.remaining} left` : ''
                  return (
                    <div key={c.id} className={`flex items-center gap-3 border-b border-[#eeeae2] p-3 last:border-b-0 ${full ? 'opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={full && !on}
                        onChange={() => toggleCottage(c)}
                        className="h-4 w-4 shrink-0"
                        aria-label={`Add ${c.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-forest">
                          {c.name}
                          {c.option ? ` · ${c.option}` : ''}
                        </p>
                        <p className="text-[11px] text-[#8a958f]">
                          {full ? 'Fully booked today' : `${c.price_note ?? ''}${left}`.replace(/^ · /, '')}
                        </p>
                      </div>
                      <span className="text-[12px] font-bold text-forest">₱{c.price.toLocaleString()}</span>
                      {on && (
                        <input
                          type="number"
                          min={1}
                          max={max}
                          step={1}
                          value={pickedCottages[c.id]}
                          onChange={(e) => setPickedCottages((p) => ({ ...p, [c.id]: e.target.value }))}
                          aria-label={`Quantity for ${c.name}`}
                          className={qtyClass}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

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
                            className={qtyClass}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mb-[18px] mt-1 grid gap-2 bg-[#eee9de] px-[18px] py-[15px] text-[12px] text-[#465e54]">
              <div className="flex justify-between"><span>Cottages</span><strong>{peso(cottageCents)}</strong></div>
              {actsCents > 0 && <div className="flex justify-between"><span>Activities</span><strong>{peso(actsCents)}</strong></div>}
              <div className="flex justify-between border-t border-[#d8d2c4] pt-2"><span>Total</span><strong>{peso(totalCents)}</strong></div>
              <div className="flex justify-between text-forest"><span className="font-bold">30% downpayment</span><strong className="text-[15px]">{peso(downCents)}</strong></div>
              <div className="flex justify-between"><span>Balance on arrival</span><strong>{peso(totalCents - downCents)}</strong></div>
              <p className="text-[10px] text-[#748079]">The final amounts are confirmed when you submit.</p>
            </div>

            {error && <p role="alert" className="mb-4 text-[12px] font-semibold text-[#ae673c]">{error}</p>}

            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? 'Submitting…' : 'Submit reservation'} <Icon name="arrow" />
            </button>
            <p className="mt-3 text-center text-[10px] text-[#8a958f]">We only use your details to manage your reservation.</p>
          </form>
        )}
      </div>
    </div>
  )
}