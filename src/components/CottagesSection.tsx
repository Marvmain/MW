import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { imageUrl } from '../lib/images'
import { formatVisitDate } from '../lib/dates'
import type { AvailabilityResult, Cottage } from '../types'
import Icon from './Icon'
import BookingModal from './BookingModal'
import Reveal from './Reveal'

export default function CottagesSection({
  availability,
  onBooked,
}: {
  availability: AvailabilityResult | null
  onBooked: () => void
}) {
  const [items, setItems] = useState<Cottage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('cottages')
      .select('*')
      .order('sort_order')
      .order('created_at')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError('We could not load the cottages. Please refresh the page.')
        else setItems(data as Cottage[])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const byId = new Map((availability?.rows ?? []).map((r) => [r.cottage_id, r]))

  return (
    <section id="cottages" className="mx-auto max-w-[1240px] px-[42px] py-[100px] max-[640px]:px-[22px] max-[640px]:py-[72px]">
      <Reveal className="mb-[42px] max-[640px]:mb-[30px]">
        <div className="flex items-end justify-between gap-10 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-4">
          <div className="max-w-[590px]">
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage">Stay close to the river</span>
            <h2 className="text-[clamp(32px,3.5vw,46px)] font-bold leading-[1.14] tracking-[-.035em] text-forest">
              A cottage for every kind of day
            </h2>
          </div>
          <p className="max-w-[390px] text-sm leading-[1.7] text-[#67766f]">
            Choose a comfortable base for a day of swimming, sharing meals, and making memories.
          </p>
        </div>
      </Reveal>

      {availability && (
        <p className="mb-6 text-[12px] font-semibold text-[#2f694d]">Showing availability for {formatVisitDate(availability.date)}</p>
      )}

      {loading && (
        <div className="grid grid-cols-4 gap-[18px] max-[900px]:grid-cols-2 max-[640px]:grid-cols-1" aria-busy="true" aria-label="Loading cottages">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border border-[#e2ddd2] bg-white">
              <div className="h-[245px] bg-[#e8efe8] max-[640px]:h-[230px]" />
              <div className="space-y-3 p-[22px]">
                <div className="h-5 w-2/3 rounded bg-[#e8efe8]" />
                <div className="h-3 w-1/3 rounded bg-[#eef2ee]" />
                <div className="h-3 w-full rounded bg-[#eef2ee]" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-[#ae673c]">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-[#67766f]">Our cottages will be posted here soon.</p>
      )}

      <div className="grid grid-cols-4 gap-[18px] max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
        {items.map((c, i) => {
          const url = imageUrl(c.image_path)
          const slot = byId.get(c.id)
          const full = slot ? slot.remaining <= 0 : false
          return (
            <Reveal key={c.id} delay={(i % 4) * 90} className="h-full">
              <article className="group h-full border border-[#e2ddd2] bg-white">
                <div className="relative h-[245px] overflow-hidden bg-[#e8efe8] max-[640px]:h-[230px]">
                  {url ? (
                    <img
                      src={url}
                      alt={`${c.name}${c.option ? ' ' + c.option : ''}`}
                      loading="lazy"
                      className={`h-full w-full object-cover transition-transform duration-[350ms] group-hover:scale-[1.025] ${full ? 'opacity-70 grayscale' : ''}`}
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-[#9ba49f]">
                      <Icon name="leaf" size={28} />
                    </span>
                  )}
                  {c.option && (
                    <span className="absolute left-4 top-4 bg-cream px-2.5 py-[7px] text-[9px] font-bold uppercase tracking-[.1em] text-[#345345]">
                      {c.option}
                    </span>
                  )}
                  {slot && (
                    <span
                      key={`${full ? 'full' : 'open'}-${slot.remaining}`}
                      className={`absolute right-4 top-4 animate-fade-in rounded-full px-2.5 py-[7px] text-[9px] font-bold uppercase tracking-[.1em] ${
                        full ? 'bg-[#eceeed] text-[#6f7d76]' : 'bg-[#e3eee4] text-[#2f694d]'
                      }`}
                    >
                      {full ? 'Fully booked' : slot.units > 1 ? `Available · ${slot.remaining} left` : 'Available'}
                    </span>
                  )}
                </div>
                <div className="p-[22px]">
                  <div className="flex justify-between gap-3.5">
                    <div>
                      <h3 className="text-xl font-bold tracking-[-.02em] text-forest">{c.name}</h3>
                      {c.option && (
                        <p className="mt-[7px] flex items-center gap-[5px] text-[11px] text-[#7a857f]">
                          <Icon name="home" size={15} /> {c.option} option
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <strong className="block text-[19px] font-extrabold tracking-[-.025em]">₱{c.price.toLocaleString()}</strong>
                    </div>
                  </div>
                  {c.price_note && (
                    <div className="mt-[18px] flex items-center gap-[5px] border-y border-[#eeeae2] py-[13px] text-[10px] text-[#6e7e77]">
                      <Icon name="calendar" size={15} /> {c.price_note}
                    </div>
                  )}
                  {full ? (
                    <p className={`pt-[18px] text-xs font-bold text-[#8a958f] ${c.price_note ? '' : 'mt-[18px] border-t border-[#eeeae2]'}`}>
                      Fully booked today
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBooking(c.id)}
                      className={`flex w-full items-center justify-between border-0 bg-transparent pt-[18px] text-xs font-bold text-[#235440] ${c.price_note ? '' : 'mt-[18px] border-t border-[#eeeae2]'}`}
                    >
                      View cottage &amp; book <Icon name="arrow" size={16} />
                    </button>
                  )}
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>

      {booking && (
        <BookingModal
          cottages={items}
          initialId={booking}
          availability={availability}
          onClose={() => setBooking(null)}
          onBooked={onBooked}
        />
      )}
    </section>
  )
}