
import Icon from './Icon'

const heroPhoto =
  'https://scontent.fceb2-2.fna.fbcdn.net/v/t39.30808-6/635167791_912552271290703_3680617344999851764_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1536&ctp=s2048x1536&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeFutDTc5gYLtWY9dZUwpfNeDUJe9gme7_wNQl72CZ7v_AuwTUixQ3TA2b5YGHExP2tuY9IVBBfKCphmQjZJVvrR&_nc_ohc=UoaV8CAynC0Q7kNvwGz2dBN&_nc_oc=AdoFCTI01i_JQ_hPaPGvVKwTDzWHv36FK4K7UX30IkBlkcU6Unlu7rEn5qff5Radzhc&_nc_zt=23&_nc_ht=scontent.fceb2-2.fna&_nc_gid=wZTg1pS2MjQF7gsNtdazPg&_nc_ss=7b2a8&oh=00_AQP8ziw-i6P1QLvwQ4NjEQsQ1EVwZe10NgO4aS01OqKDqA&oe=6AE3A12F'

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[610px] items-center overflow-hidden bg-[#0F3125] px-[clamp(24px,8vw,124px)] py-[90px] text-white max-[900px]:min-h-[560px] max-[640px]:min-h-[510px] max-[640px]:px-6 max-[640px]:pb-20 max-[640px]:pt-[60px]">
      {/* Background image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center max-[640px]:bg-[62%_center]"
        style={{
          backgroundImage: `url("${heroPhoto}")`,
          filter: 'saturate(1.08) contrast(1.04)',
        }}
      />

      {/* Dark green overlay for readable text */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#0B2D22]/85 via-[#0F3125]/55 to-[#0F3125]/10"
      />

      {/* Subtle bottom shading */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#0B2D22]/35 via-transparent to-transparent"
      />

      {/* Hero content */}
      <div className="relative z-10 max-w-[680px]">
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-[#E8D6A9]">
          A quiet corner of Pandan, Antique
        </span>

        <h1 className="font-serif text-[clamp(48px,6vw,82px)] font-semibold leading-[1.02] tracking-[-.035em] text-[#FFFDF8]">
          Slow down.
          <br />
          Let the river lead.
        </h1>

        <p className="mb-[30px] mt-6 max-w-[520px] text-base leading-[1.8] text-[#F2F4EF] max-[640px]:text-sm">
          Simple cottages, cool water, and unhurried days surrounded by the
          natural beauty of Antique.
        </p>

        <a
          href="#cottages"
          className="inline-flex min-h-12 items-center justify-center gap-[10px] rounded-md border border-[#E3C99B] bg-[#F7F2E7] px-6 text-[13px] font-bold text-[#173F32] no-underline shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#E3C99B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7F2E7]"
        >
          Explore our cottages
          <Icon name="arrow" size={17} />
        </a>
      </div>

      {/* Nature note */}
      <div className="absolute bottom-[38px] right-[5vw] z-10 hidden items-center gap-3 border-l border-white/60 pl-[18px] text-white min-[901px]:flex">
        <Icon name="leaf" />
        <span className="flex flex-col">
          <strong className="text-xs font-semibold">Rooted in nature</strong>
          <small className="mt-1 text-[10px] text-white/85">
            A restful riverside escape
          </small>
        </span>
      </div>
    </section>
  )
}
