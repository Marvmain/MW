import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatVisitDate, todayInManila } from '../../lib/dates'
import { peso } from '../../lib/money'
import type { ReservationRow } from '../../types'
import { useFeedback } from '../../components/Feedback'
import { useReservationChanges } from '../../lib/useReservationChanges'

type Shown = 'pending_proof' | 'expired' | 'for_verification' | 'confirmed' | 'checked_in' | 'cancelled'
type Filter = 'all' | 'for_verification' | 'pending_proof' | 'confirmed' | 'checked_in' | 'closed'

const STATUS: Record<Shown, { label: string; cls: string }> = {
  pending_proof: { label: 'Pending proof', cls: 'bg-[#fff1dc] text-[#a6672f]' },
  expired: { label: 'Hold expired', cls: 'bg-[#eceeed] text-[#6f7d76]' },
  for_verification: { label: 'For verification', cls: 'bg-[#fff1dc] text-[#a6672f]' },
  confirmed: { label: 'Confirmed', cls: 'bg-[#e3eee4] text-[#2f694d]' },
  checked_in: { label: 'Checked in', cls: 'bg-[#e5edf2] text-[#45697d]' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#eceeed] text-[#6f7d76]' },
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'for_verification', label: 'For verification' },
  { id: 'pending_proof', label: 'Pending proof' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'checked_in', label: 'Checked in' },
  { id: 'closed', label: 'Cancelled / expired' },
]

const REASONS = [
  'The screenshot is blurry or unreadable.',
  'The amount does not match the downpayment.',
  'The payment was not sent to our account.',
  'The reference number or date is not visible.',
]

function shownStatus(r: ReservationRow): Shown {
  if (r.status === 'pending_proof' && new Date(r.hold_expires_at).getTime() < Date.now()) return 'expired'
  return r.status
}

function matchesFilter(r: ReservationRow, f: Filter) {
  const s = shownStatus(r)
  if (f === 'all') return true
  if (f === 'closed') return s === 'cancelled' || s === 'expired'
  if (f === 'pending_proof') return s === 'pending_proof'
  return s === f
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })
}

function dateOf(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric' })
}

const SELECT = `
  id, reference_code, status, visit_date, guest_name, guest_phone, guests_count,
  cottage_price, activities_total, total_amount, downpayment_amount, hold_expires_at,
  payment_proof_path, proof_uploaded_at, rejection_reason, created_at,
  reservation_cottages ( quantity, line_total, cottages ( name, option ) ),
  reservation_activities ( quantity, line_total, activities ( name, option ) )
`

export default function ReservationsAdmin() {
  const [rows, setRows] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const { toast, confirm } = useFeedback()
  const [dateMode, setDateMode] = useState<'today' | 'all'>('today')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [proof, setProof] = useState<{ url: string; pdf: boolean; reference: string } | null>(null)
  const [details, setDetails] = useState<ReservationRow | null>(null)
  const [menu, setMenu] = useState<{ reservation: ReservationRow; top: number; right: number } | null>(null)
  const [rejecting, setRejecting] = useState<ReservationRow | null>(null)
  const [reason, setReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [rejectBusy, setRejectBusy] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('reservations').select(SELECT).order('created_at', { ascending: false }).limit(300)
    if (dateMode === 'today') query = query.eq('visit_date', todayInManila())
    const { data, error } = await query
    if (error) setPageError('Could not load reservations. ' + error.message)
    else {
      setPageError('')
      setRows(data as unknown as ReservationRow[])
    }
    setLoading(false)
  }, [dateMode])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void load()
    }, 0)
    const timer = window.setInterval(() => {
      void load()
    }, 30000)

    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
    }
  }, [load])

  // Live updates: new bookings and new payment proofs appear instantly
  useReservationChanges(
    true,
    (change) => {
      const row = change.new as { id?: string; reference_code?: string; status?: string }
      if (change.eventType === 'INSERT' && row.reference_code) {
        toast(`New reservation ${row.reference_code}.`, 'info')
      }
      if (change.eventType === 'UPDATE' && row.status === 'for_verification' && row.reference_code) {
        toast(`Payment proof received for ${row.reference_code}.`, 'info')
      }
      if (row.id && (change.eventType === 'INSERT' || row.status === 'for_verification')) {
        const id = row.id
        setFlashId(id)
        window.setTimeout(() => setFlashId((current) => (current === id ? null : current)), 2600)
      }
      void load()
    },
    'reservations-list',
  )

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  useEffect(() => {
    if (!proof && !details && !rejecting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProof(null)
        setDetails(null)
        setRejecting(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [proof, details, rejecting])

  async function act(r: ReservationRow, action: 'confirm' | 'cancel') {
    const ok = await confirm(
      action === 'confirm'
        ? {
            title: 'Confirm this payment?',
            message: `${r.reference_code} will be marked Confirmed, and the guest will see it in “My booking”.`,
            confirmLabel: 'Confirm payment',
          }
        : {
            title: 'Cancel this reservation?',
            message: `${r.reference_code} will be cancelled and the cottage released. This cannot be undone.`,
            confirmLabel: 'Cancel reservation',
            danger: true,
          },
    )
    if (!ok) return

    setBusyId(r.id)
    setPageError('')
    const { error } = await supabase.rpc('staff_update_reservation', { p_id: r.id, p_action: action })
    setBusyId(null)
    if (error) {
      toast(error.code === 'P0001' ? error.message : 'Could not update the reservation. Please try again.', 'error')
      return
    }
    toast(action === 'confirm' ? `${r.reference_code} confirmed.` : `${r.reference_code} cancelled.`)
    void load()
  }

  function openReject(r: ReservationRow) {
    setReason('')
    setRejectError('')
    setRejecting(r)
  }

  async function rejectProof() {
    if (!rejecting) return
    const r = rejecting
    const text = reason.trim()
    if (text.length < 3) {
      setRejectError('Please write a short reason for the guest.')
      return
    }
    setRejectBusy(true)
    setRejectError('')
    const { data, error } = await supabase.rpc('staff_update_reservation', { p_id: r.id, p_action: 'reject', p_reason: text })
    setRejectBusy(false)
    if (error) {
      setRejectError(error.code === 'P0001' ? error.message : 'Could not reject the proof. Please try again.')
      return
    }
    const prev = (data as { previous_proof_path?: string | null } | null)?.previous_proof_path
    if (prev) await supabase.storage.from('payment-proofs').remove([prev])
    setRejecting(null)
    setReason('')
    toast(`${r.reference_code}: proof rejected. The guest can upload a new one.`)
    void load()
  }

  async function viewProof(r: ReservationRow) {
    if (!r.payment_proof_path) return
    const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(r.payment_proof_path, 120)
    if (error || !data) {
      setPageError('Could not open the payment proof.')
      return
    }
    setProof({ url: data.signedUrl, pdf: r.payment_proof_path.toLowerCase().endsWith('.pdf'), reference: r.reference_code })
  }

  const q = search.trim().toLowerCase()
  const visible = rows.filter(
    (r) =>
      matchesFilter(r, filter) &&
      (!q ||
        r.reference_code.toLowerCase().includes(q) ||
        r.guest_name.toLowerCase().includes(q) ||
        r.guest_phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§')),
  )

  const chipClass = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-[11px] font-bold ${on ? 'border-[#285444] bg-[#285444] text-white' : 'border-[#d7ddd8] bg-white text-[#466158] hover:bg-[#f4f6f3]'}`
  const smallBtn = 'h-[33px] rounded-[3px] border border-[#d7ddd8] bg-white px-3 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3] disabled:opacity-50'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-.025em] text-[#1d3c31]">Reservations</h1>
          <p className="mt-1 text-[12px] text-[#849089]">Manage guest bookings and payment verification.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDateMode('today')} className={chipClass(dateMode === 'today')}>Today</button>
          <button onClick={() => setDateMode('all')} className={chipClass(dateMode === 'all')}>All dates</button>
          <button onClick={() => void load()} className={smallBtn}>Refresh</button>
        </div>
      </div>

      
      {pageError && <p className="mb-4 border border-[#e8c9b8] bg-[#fff1dc] px-4 py-3 text-[12px] text-[#a6672f]">{pageError}</p>}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const count = rows.filter((r) => matchesFilter(r, f.id)).length
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} className={chipClass(filter === f.id)}>
                {f.label} <span className={filter === f.id ? 'text-white/70' : 'text-[#849089]'}>{count}</span>
              </button>
            )
          })}
        </div>
        <label className="relative block w-full max-w-[310px]">
          <span className="sr-only">Search reservations</span>
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849089]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reservations"
            className="h-[38px] w-full border border-[#d8d5cc] bg-white pl-9 pr-3 text-[12px] text-forest outline-none placeholder:text-[#9aa39e] focus:border-[#30624d]"
          />
        </label>
      </div>

      <div className="overflow-x-auto border border-[#dfe4df] bg-white shadow-[0_1px_2px_rgba(27,56,44,.04)]">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[.08em] text-[#7c8982]">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold">Reference</th>
              <th scope="col" className="px-4 py-3 font-bold">Guest</th>
              <th scope="col" className="px-4 py-3 font-bold">Visit date</th>
              <th scope="col" className="px-4 py-3 font-bold">Cottage</th>
              <th scope="col" className="px-4 py-3 font-bold">Downpayment</th>
              <th scope="col" className="px-4 py-3 font-bold">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-bold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0ed]">
            {visible.map((r) => {
              const s = shownStatus(r)
              const cottage = r.reservation_cottages[0]
              const cottageName = cottage
                ? `${cottage.cottages?.name ?? 'Cottage'}${cottage.cottages?.option ? ' · ' + cottage.cottages.option : ''}`
                : '—'
              return (
                  <tr key={r.id} className={`transition-colors hover:bg-[#fbfcfa] ${flashId === r.id ? 'animate-row-flash' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-[15px] text-[11px] font-bold tracking-[.015em] text-[#263f36]">
                    <button type="button" onClick={() => setDetails(r)} className="text-left hover:text-[#285444] hover:underline">
                      {r.reference_code}
                    </button>
                  </td>
                  <td className="max-w-[155px] truncate px-4 py-[15px] text-[11px] text-[#607168]" title={r.guest_name}>{r.guest_name}</td>
                  <td className="whitespace-nowrap px-4 py-[15px] text-[11px] text-[#607168]">{formatVisitDate(r.visit_date)}</td>
                  <td className="max-w-[180px] truncate px-4 py-[15px] text-[11px] text-[#607168]" title={cottageName}>
                    {cottageName}{r.reservation_cottages.length > 1 ? ` +${r.reservation_cottages.length - 1}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-[15px] text-[11px] text-[#607168]">
                    {peso(Math.round(r.downpayment_amount * 100))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-[15px]">
                    <span className={`inline-flex rounded-full px-2.5 py-[5px] text-[9px] font-bold ${STATUS[s].cls}`}>{STATUS[s].label}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-[10px] text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === 'for_verification' && (
                        <button
                          type="button"
                          onClick={() => void act(r, 'confirm')}
                          disabled={busyId === r.id}
                          className="h-[32px] rounded-[3px] bg-[#285444] px-3 text-[10px] font-bold text-white hover:bg-[#214638] disabled:opacity-50"
                        >
                          {busyId === r.id ? 'Working…' : 'Verify'}
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`More actions for ${r.reference_code}`}
                        aria-expanded={menu?.reservation.id === r.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (menu?.reservation.id === r.id) {
                            setMenu(null)
                            return
                          }
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenu({ reservation: r, top: Math.min(rect.bottom + 4, window.innerHeight - 230), right: window.innerWidth - rect.right })
                        }}
                        className="grid h-[32px] w-[32px] place-items-center rounded text-[#829189] hover:bg-[#f0f4f1] hover:text-[#285444] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#285444]"
                      >
                        <span aria-hidden="true" className="text-[18px] leading-none">•••</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[12px] text-[#849089]">
                  {pageError ? 'Reservations are unavailable.' : 'No reservations match your search and filters.'}
                </td>
              </tr>
            )}
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[12px] text-[#849089]">Loading reservations…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-right text-[10px] text-[#8a958f]">Auto-refreshes every 30 seconds · {visible.length} shown</p>

      {menu && (
        <div
          role="menu"
          className="fixed z-40 min-w-[176px] rounded border border-[#dfe4df] bg-white p-1 shadow-[0_8px_24px_rgba(22,52,40,.16)]"
          style={{ top: Math.max(8, menu.top), right: Math.max(8, menu.right) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button role="menuitem" type="button" onClick={() => { setDetails(menu.reservation); setMenu(null) }} className="block w-full rounded px-3 py-2 text-left text-[11px] text-[#365347] hover:bg-[#f3f6f3]">
            Reservation details
          </button>
          {menu.reservation.payment_proof_path && (
            <button role="menuitem" type="button" onClick={() => { void viewProof(menu.reservation); setMenu(null) }} className="block w-full rounded px-3 py-2 text-left text-[11px] text-[#365347] hover:bg-[#f3f6f3]">
              View payment proof
            </button>
          )}
          {menu.reservation.status === 'for_verification' && (
            <button role="menuitem" type="button" disabled={busyId === menu.reservation.id} onClick={() => { void act(menu.reservation, 'confirm'); setMenu(null) }} className="block w-full rounded px-3 py-2 text-left text-[11px] font-semibold text-[#285444] hover:bg-[#f3f6f3] disabled:opacity-50">
              Confirm payment
            </button>
          )}
          {menu.reservation.status === 'for_verification' && (
            <button role="menuitem" type="button" onClick={() => { openReject(menu.reservation); setMenu(null) }} className="block w-full rounded px-3 py-2 text-left text-[11px] text-[#a75e3b] hover:bg-[#fff7f1]">
              Reject proof
            </button>
          )}
          {menu.reservation.status !== 'cancelled' && menu.reservation.status !== 'checked_in' && (
            <button role="menuitem" type="button" disabled={busyId === menu.reservation.id} onClick={() => { void act(menu.reservation, 'cancel'); setMenu(null) }} className="block w-full rounded px-3 py-2 text-left text-[11px] text-[#a75e3b] hover:bg-[#fff7f1] disabled:opacity-50">
              Cancel reservation
            </button>
          )}
        </div>
      )}

      {details && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(11,30,23,.72)] p-4" role="dialog" aria-modal="true" aria-labelledby="reservation-details-title" onClick={() => setDetails(null)}>
          <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto border border-[#e3e7e2] bg-white p-5 shadow-xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#edf0ed] pb-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#87948d]">Reservation details</p>
                <h2 id="reservation-details-title" className="mt-1 text-[19px] font-bold text-[#1d3c31]">{details.reference_code}</h2>
              </div>
              <button type="button" onClick={() => setDetails(null)} className="rounded border border-[#d7ddd8] px-3 py-1.5 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3]">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-[11px]">
              <div><p className="text-[#849089]">Guest</p><p className="mt-1 font-semibold text-[#365347]">{details.guest_name}</p></div>
              <div><p className="text-[#849089]">Phone</p><a href={`tel:${details.guest_phone}`} className="mt-1 inline-block font-semibold text-[#235440] underline">{details.guest_phone}</a></div>
              <div><p className="text-[#849089]">Visit date</p><p className="mt-1 font-semibold text-[#365347]">{formatVisitDate(details.visit_date)}</p></div>
              <div><p className="text-[#849089]">Guests</p><p className="mt-1 font-semibold text-[#365347]">{details.guests_count}</p></div>
              <div className="col-span-2"><p className="text-[#849089]">Cottages</p><p className="mt-1 font-semibold text-[#365347]">{details.reservation_cottages.map((c) => `${c.cottages?.name ?? 'Cottage'}${c.cottages?.option ? ' · ' + c.cottages.option : ''} × ${c.quantity}`).join(', ') || '—'}</p></div>
              {!!details.reservation_activities.length && <div className="col-span-2"><p className="text-[#849089]">Activities</p><p className="mt-1 font-semibold text-[#365347]">{details.reservation_activities.map((a) => `${a.activities?.name ?? 'Activity'}${a.activities?.option ? ' · ' + a.activities.option : ''} × ${a.quantity}`).join(', ')}</p></div>}
              <div><p className="text-[#849089]">Total</p><p className="mt-1 font-semibold text-[#365347]">{peso(Math.round(details.total_amount * 100))}</p></div>
              <div><p className="text-[#849089]">Downpayment</p><p className="mt-1 font-semibold text-[#365347]">{peso(Math.round(details.downpayment_amount * 100))}</p></div>
              <div><p className="text-[#849089]">Balance</p><p className="mt-1 font-semibold text-[#365347]">{peso(Math.round((details.total_amount - details.downpayment_amount) * 100))}</p></div>
              <div><p className="text-[#849089]">Booked</p><p className="mt-1 font-semibold text-[#365347]">{dateOf(details.created_at)} · {timeOf(details.created_at)}</p></div>
              {shownStatus(details) === 'pending_proof' && <div className="col-span-2"><p className="text-[#849089]">Payment hold expires</p><p className="mt-1 font-semibold text-[#a6672f]">{timeOf(details.hold_expires_at)}</p></div>}
              {details.proof_uploaded_at && <div className="col-span-2"><p className="text-[#849089]">Proof uploaded</p><p className="mt-1 font-semibold text-[#365347]">{dateOf(details.proof_uploaded_at)} · {timeOf(details.proof_uploaded_at)}</p></div>}
              {details.rejection_reason && details.status === 'pending_proof' && <div className="col-span-2"><p className="text-[#849089]">Last proof was rejected</p><p className="mt-1 font-semibold text-[#ae673c]">{details.rejection_reason}</p></div>}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#edf0ed] pt-4">
              {details.payment_proof_path && <button type="button" onClick={() => { void viewProof(details); setDetails(null) }} className={smallBtn}>View payment proof</button>}
              {details.status === 'for_verification' && <button type="button" disabled={busyId === details.id} onClick={() => { void act(details, 'confirm'); setDetails(null) }} className="h-[33px] rounded-[3px] bg-[#285444] px-3 text-[11px] font-bold text-white hover:bg-[#214638] disabled:opacity-50">Confirm payment</button>}
              {details.status === 'for_verification' && <button type="button" onClick={() => { openReject(details); setDetails(null) }} className={`${smallBtn} !text-[#ae673c]`}>Reject proof</button>}
              {details.status !== 'cancelled' && details.status !== 'checked_in' && <button type="button" disabled={busyId === details.id} onClick={() => { void act(details, 'cancel'); setDetails(null) }} className={`${smallBtn} !text-[#ae673c]`}>Cancel reservation</button>}
            </div>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(11,30,23,.72)] p-5" role="dialog" aria-modal="true" aria-labelledby="reject-title">
          <div className="w-full max-w-[460px] bg-paper p-7 shadow-[0_30px_80px_rgba(0,0,0,.25)]">
            <h2 id="reject-title" className="text-[22px] font-bold tracking-[-.03em] text-forest">Reject payment proof?</h2>
            <p className="mt-3 text-[13px] leading-[1.7] text-[#687870]">
              <strong>{rejecting.reference_code}</strong>: the guest will see your reason in “My booking” and can upload a new proof. Their hold is extended by 2 hours and the rejected file is deleted.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {REASONS.map((text) => (
                <button key={text} type="button" onClick={() => setReason(text)} className="rounded-full border border-[#d7ddd8] bg-white px-3 py-1.5 text-left text-[11px] font-semibold text-[#466158] hover:bg-[#f4f6f3]">
                  {text}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-[11px] font-bold text-[#465e54]">
              Reason shown to the guest
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                rows={3}
                className="mt-[7px] w-full border border-[#d8d5cc] bg-white p-3 text-[13px] font-normal text-forest outline-none focus:border-[#30624d]"
              />
            </label>
            {rejectError && <p role="alert" className="mt-3 text-[12px] font-semibold text-[#ae673c]">{rejectError}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setRejecting(null)} className="min-h-11 flex-1 rounded-[3px] border border-[#d7ddd8] bg-white text-[13px] font-bold text-[#466158]">
                Cancel
              </button>
              <button type="button" onClick={() => void rejectProof()} disabled={rejectBusy} className="min-h-11 flex-1 rounded-[3px] bg-[#ae673c] text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60">
                {rejectBusy ? 'Rejecting…' : 'Reject proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {proof && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(11,30,23,.8)] p-5" role="dialog" aria-modal="true" aria-label={`Payment proof for ${proof.reference}`} onClick={() => setProof(null)}>
          <div className="relative max-h-[94vh] w-full max-w-[720px] overflow-y-auto bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <strong className="text-[14px] text-forest">Payment proof · {proof.reference}</strong>
              <button onClick={() => setProof(null)} className="rounded border border-[#d7ddd8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#466158]">
                Close
              </button>
            </div>
            {proof.pdf ? (
              <a href={proof.url} target="_blank" rel="noreferrer" className="inline-block rounded-[3px] bg-green px-4 py-3 text-[13px] font-bold text-white no-underline">
                Open PDF in a new tab
              </a>
            ) : (
              <img src={proof.url} alt={`Payment proof for ${proof.reference}`} className="mx-auto max-h-[75vh] w-auto max-w-full object-contain" />
            )}
            <p className="mt-3 text-[10px] text-[#8a958f]">This private link expires in 2 minutes.</p>
          </div>
        </div>
      )}
    </div>
  )
}