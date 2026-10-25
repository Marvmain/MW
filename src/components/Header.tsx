import { useState } from 'react'
import BrandMark from './BrandMark'
import Icon from './Icon'

const links = [
  { label: 'Cottages', href: '#cottages', icon: 'bed' },
  { label: 'Activities', href: '#activities', icon: 'bike' },
  { label: 'Our Place', href: '#visit', icon: 'leaf' },
] as const

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="relative z-20 flex h-[74px] items-center justify-between border-b border-[#ded8cc] bg-paper px-[clamp(24px,5vw,76px)] max-[640px]:px-5">
      <a href="#top" className="inline-flex items-center gap-2.5 text-forest no-underline">
        <BrandMark />
        <span className="flex flex-col leading-none tracking-[.08em]">
          <strong className="text-sm font-bold">MW DUMAGAT</strong>
          <small className="mt-1 text-[8px] tracking-[.24em]">RIVER RESORT</small>
        </span>
      </a>

      <nav
        className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-[74px] flex-col items-stretch gap-5 border-b border-[#d8d3ca] bg-paper p-6 min-[901px]:static min-[901px]:flex min-[901px]:flex-row min-[901px]:items-center min-[901px]:gap-8 min-[901px]:border-0 min-[901px]:bg-transparent min-[901px]:p-0`}
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-[7px] text-[13px] font-semibold text-[#50665d] no-underline hover:text-forest"
          >
            <span className="text-[#789068]">
              <Icon name={link.icon} size={16} />
            </span>
            {link.label}
          </a>
        ))}
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
        className="border-0 bg-transparent text-forest min-[901px]:hidden"
      >
        <Icon name={open ? 'close' : 'menu'} />
      </button>
    </header>
  )
}