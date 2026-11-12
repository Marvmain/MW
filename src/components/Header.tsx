import { useEffect, useState } from 'react'
import BrandMark from './BrandMark'
import Icon from './Icon'

const links = [
  { label: 'Cottages', href: '#cottages', id: 'cottages', icon: 'bed' },
  { label: 'Activities', href: '#activities', id: 'activities', icon: 'bike' },
  { label: 'Our Place', href: '#visit', id: 'visit', icon: 'leaf' },
] as const

// Page sections from top to bottom, used to know which menu link is current
const ORDER = ['cottages', 'activities', 'highlights', 'steps', 'visit']

export default function Header({ onTrack }: { onTrack: () => void }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState('')

  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      setScrolled(window.scrollY > 8)
      let active = ''
      for (const id of ORDER) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 140) active = id
      }
      setCurrent(active)
    }
    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const linkClass = (active: boolean) =>
    `relative inline-flex items-center gap-[7px] border-0 bg-transparent text-[13px] font-semibold no-underline after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:bg-[#789068] after:transition-transform after:duration-300 hover:text-forest hover:after:scale-x-100 ${
      active ? 'text-forest after:scale-x-100' : 'text-[#50665d] after:scale-x-0'
    }`

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between border-b border-[#ded8cc] px-[clamp(24px,5vw,76px)] transition-[height,box-shadow,background-color] duration-300 max-[640px]:px-5 ${
        scrolled ? 'h-[62px] bg-paper/95 shadow-[0_6px_24px_rgba(31,54,44,.08)] backdrop-blur' : 'h-[74px] bg-paper'
      }`}
    >
      <a href="#top" className="inline-flex items-center gap-2.5 text-forest no-underline">
        <BrandMark />
        <span className="flex flex-col leading-none tracking-[.08em]">
          <strong className="text-sm font-bold">MW DUMAGAT</strong>
          <small className="mt-1 text-[8px] tracking-[.24em]">RIVER RESORT</small>
        </span>
      </a>

      <nav
        className={`absolute left-0 right-0 top-full flex flex-col items-stretch gap-5 border-b border-[#d8d3ca] bg-paper p-6 transition-[opacity,translate,visibility] duration-200 ${
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
        } min-[901px]:visible min-[901px]:static min-[901px]:translate-y-0 min-[901px]:flex-row min-[901px]:items-center min-[901px]:gap-8 min-[901px]:border-0 min-[901px]:bg-transparent min-[901px]:p-0 min-[901px]:opacity-100`}
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            aria-current={current === link.id ? 'true' : undefined}
            className={linkClass(current === link.id)}
          >
            <span className="text-[#789068]">
              <Icon name={link.icon} size={16} />
            </span>
            {link.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onTrack()
          }}
          className={linkClass(false)}
        >
          <span className="text-[#789068]">
            <Icon name="search" size={16} />
          </span>
          My booking
        </button>
        <a
          href="#cottages"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-11 items-center justify-center gap-[9px] rounded-[3px] bg-forest px-[22px] text-[13px] font-bold text-white no-underline hover:-translate-y-px hover:brightness-105"
        >
          Book your visit <Icon name="arrow" size={16} />
        </a>
      </nav>

      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="border-0 bg-transparent text-forest min-[901px]:hidden"
      >
        <Icon name={open ? 'close' : 'menu'} />
      </button>
    </header>
  )
}