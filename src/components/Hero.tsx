import Icon from './Icon'

const heroPhoto = '/images/Cinematic Jungle Lagoon Diving Platform.png'

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[610px] items-center bg-cover bg-center px-[clamp(24px,8vw,124px)] py-[90px] text-white max-[900px]:min-h-[560px] max-[640px]:min-h-[510px] max-[640px]:bg-[62%_center] max-[640px]:px-6 max-[640px]:pb-20 max-[640px]:pt-[60px]"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(15,49,37,.8), rgba(15,49,37,.12)), url("${heroPhoto}")`,
      }}
    >
      <div className="max-w-[680px]">
        <span className="mb-4 block animate-rise-in text-[10px] font-bold uppercase tracking-[.18em] text-[#cbd9b5]">
          A quiet corner of Pandan, Antique
        </span>
        <h1
          className="animate-rise-in font-serif text-[clamp(48px,6vw,82px)] font-semibold leading-[1.02] tracking-[-.035em]"
          style={{ animationDelay: '120ms' }}
        >
          Slow down.
          <br />
          Let the river lead.
        </h1>
        <p
          className="mb-[30px] mt-6 max-w-[520px] animate-rise-in text-base leading-[1.7] text-[#e8eee8] max-[640px]:text-sm"
          style={{ animationDelay: '240ms' }}
        >
          Simple cottages, cool water, and unhurried days surrounded by the natural beauty of Antique.
        </p>
        <a
          href="#cottages"
          className="inline-flex min-h-11 animate-rise-in items-center justify-center gap-[9px] rounded-[3px] bg-[#f4eddf] px-[22px] text-[13px] font-bold text-forest no-underline hover:-translate-y-px hover:brightness-105"
          style={{ animationDelay: '360ms' }}
        >
          Explore our cottages <Icon name="arrow" size={17} />
        </a>
      </div>

      <div
        className="absolute bottom-[38px] right-[5vw] hidden animate-fade-in items-center gap-3 border-l border-white/50 pl-[18px] min-[901px]:flex"
        style={{ animationDelay: '600ms' }}
      >
        <Icon name="leaf" />
        <span className="flex flex-col">
          <strong className="text-xs">Rooted in nature</strong>
          <small className="mt-1 text-[10px] opacity-75">A restful riverside escape</small>
        </span>
      </div>
    </section>
  )
}