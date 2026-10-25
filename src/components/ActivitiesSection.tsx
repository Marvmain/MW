import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { imageUrl } from '../lib/images'
import type { Activity } from '../types'
import Icon from './Icon'

const GAP = 18

export default function ActivitiesSection() {
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [bar, setBar] = useState({ w: 100, l: 0 })
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('activities')
      .select('*')
      .order('sort_order')
      .order('created_at')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError('We could not load the activities. Please refresh the page.')
        else setItems(data as Activity[])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    const w = Math.min(100, (el.clientWidth / el.scrollWidth) * 100)
    const max = el.scrollWidth - el.clientWidth
    const l = max > 0 ? (el.scrollLeft / max) * (100 - w) : 0
    setBar({ w, l })
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [items, updateArrows])

  function slide(direction: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + GAP : 240
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  const arrowClass =
    'grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/40 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <section id="activities" className="relative overflow-hidden bg-[#1e4a3b] text-white">
      {/* Decorations (behind everything) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-white">
        {/* waves, top right */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=".2" className="absolute -right-16 -top-4 w-[460px] opacity-[.08]">
          <path d="M2 6c2-2 4-2 6 0s4 2 6 0 4-2 8 0M2 12c2-2 4-2 6 0s4 2 6 0 4-2 8 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 8 0" />
        </svg>

        {/* ripples, bottom left */}
        <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1" className="absolute -bottom-44 -left-36 w-[480px] opacity-[.1]">
          <circle cx="200" cy="200" r="40" />
          <circle cx="200" cy="200" r="80" />
          <circle cx="200" cy="200" r="120" />
          <circle cx="200" cy="200" r="160" />
          <circle cx="200" cy="200" r="195" />
        </svg>

        {/* dot grid, left column */}
        <div className="absolute bottom-10 left-[42px] h-[110px] w-[170px] opacity-[.2] [background-image:radial-gradient(currentColor_1.2px,transparent_1.2px)] [background-size:16px_16px] max-[900px]:hidden" />

        {/* flowing lines along the bottom */}
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" className="absolute inset-x-0 bottom-0 h-[110px] w-full opacity-[.09]">
          <path vectorEffect="non-scaling-stroke" d="M0 80C200 20 400 120 600 70S1000 20 1200 70" />
          <path vectorEffect="non-scaling-stroke" d="M0 95C220 45 420 135 620 90S1020 40 1200 92" />
          <path vectorEffect="non-scaling-stroke" d="M0 110C240 70 440 150 640 110S1040 60 1200 112" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1240px] grid-cols-[.7fr_1.3fr] gap-[60px] px-[42px] py-[82px] max-[900px]:grid-cols-1 max-[900px]:gap-10 max-[640px]:px-[22px] max-[640px]:py-[70px]">
        <div>
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-[#cbd9b5]">More ways to enjoy the day</span>
          <h2 className="text-[clamp(32px,3.5vw,46px)] font-bold leading-[1.14] tracking-[-.035em] text-white">
            Make the river
            <br />
            your playground.
          </h2>
          <p className="mt-6 max-w-[390px] text-sm leading-[1.7] text-[#bfcfc8]">
            Add an activity to your cottage reservation. Keep it relaxed or bring a little adventure into your visit.
          </p>
          {items.length > 0 && (
            <>
              <span className="mt-8 block h-px w-24 bg-gradient-to-r from-[#cbd9b5] to-transparent" />
              <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-[11px] font-semibold text-[#cbd9b5]">
                <Icon name="leaf" size={15} />
                {items.length} {items.length === 1 ? 'activity' : 'activities'} available
              </span>
            </>
          )}
        </div>

        <div className="min-w-0">
          {loading && <p className="py-6 text-sm text-[#bfcfc8]">Loading activities…</p>}
          {error && <p className="py-6 text-sm text-[#f0c9b0]">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="py-6 text-sm text-[#bfcfc8]">Our activities will be posted here soon.</p>
          )}

          {items.length > 0 && (
            <>
              <div
                ref={trackRef}
                onScroll={updateArrows}
                role="region"
                aria-label="Activities"
                className="flex snap-x snap-mandatory gap-[18px] overflow-x-auto scroll-smooth px-1 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {items.map((a, i) => {
                  const url = imageUrl(a.image_path)
                  const title = `${a.name}${a.option ? ' · ' + a.option : ''}`
                  const note = [a.price_note, a.stock !== null ? 'Limited stock' : null].filter(Boolean).join('; ')
                  return (
                    <article
                      key={a.id}
                      className="relative h-[360px] w-[calc((100%-44px)/3)] shrink-0 snap-start overflow-hidden rounded-[10px] border border-white/25 bg-[#2d5b4a] shadow-[0_25px_25px_rgba(0,0,0,.25)] transition-transform duration-300 hover:-translate-y-1 max-[640px]:w-[72%]"
                    >
                      {url ? (
                        <img src={url} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-[#d3dfc0]/40">
                          <Icon name="leaf" size={40} />
                        </span>
                      )}
                      <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />

                      <span className="absolute left-3 top-3 rounded-full bg-deep/55 px-2.5 py-1 text-[10px] font-bold tracking-[.12em] text-white backdrop-blur-md">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {a.price === 0 ? (
                        <span className="absolute right-3 top-3 rounded-full bg-[#f4eddf] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-forest">
                          Free
                        </span>
                      ) : a.stock !== null ? (
                        <span className="absolute right-3 top-3 rounded-full bg-[#c99151] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-white">
                          Limited
                        </span>
                      ) : null}

                      <div className="absolute inset-x-0 bottom-0 bg-deep/60 p-4 backdrop-blur-md">
                        <h3 className="line-clamp-2 text-base font-bold leading-tight tracking-[-.015em]">{title}</h3>
                        {note && <p className="mt-1 line-clamp-1 text-[11px] text-[#cfdcd5]">{note}</p>}
                        <div className="mt-3 border-t border-white/20 pt-3">
                          <strong className="text-[17px] font-extrabold tracking-[-.02em]">
                            {a.price === 0 ? 'Free' : `₱${a.price.toLocaleString()}`}
                          </strong>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {(canPrev || canNext) && (
                <div className="mt-3 flex items-center gap-6">
                  <div className="relative h-[3px] flex-1 rounded-full bg-white/15" aria-hidden="true">
                    <span
                      className="absolute top-0 h-full rounded-full bg-[#cbd9b5] transition-[left] duration-150"
                      style={{ width: `${bar.w}%`, left: `${bar.l}%` }}
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => slide(-1)} disabled={!canPrev} aria-label="Previous activities" className={arrowClass}>
                      <span className="rotate-180">
                        <Icon name="arrow" size={18} />
                      </span>
                    </button>
                    <button type="button" onClick={() => slide(1)} disabled={!canNext} aria-label="Next activities" className={arrowClass}>
                      <Icon name="arrow" size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}