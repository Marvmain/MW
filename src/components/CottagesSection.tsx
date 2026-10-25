import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { imageUrl } from '../lib/images'
import type { Cottage } from '../types'
import Icon from './Icon'

export default function CottagesSection() {
  const [items, setItems] = useState<Cottage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <section id="cottages" className="mx-auto max-w-[1240px] px-[42px] py-[100px] max-[640px]:px-[22px] max-[640px]:py-[72px]">
      <div className="mb-[42px] flex items-end justify-between gap-10 max-[640px]:mb-[30px] max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-4">
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

      {loading && <p className="text-sm text-[#67766f]">Loading cottages…</p>}
      {error && <p className="text-sm text-[#ae673c]">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-[#67766f]">Our cottages will be posted here soon.</p>
      )}

      <div className="grid grid-cols-4 gap-[18px] max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
        {items.map((c) => {
          const url = imageUrl(c.image_path)
          return (
            <article key={c.id} className="group border border-[#e2ddd2] bg-white">
              <div className="relative h-[245px] overflow-hidden bg-[#e8efe8] max-[640px]:h-[230px]">
                {url ? (
                  <img
                    src={url}
                    alt={`${c.name}${c.option ? ' ' + c.option : ''}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[350ms] group-hover:scale-[1.025]"
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
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}