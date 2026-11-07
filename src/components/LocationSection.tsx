import Icon from './Icon'

export default function LocationSection() {
  return (
    <section
      id="visit"
      className="mx-auto mb-[100px] grid min-h-[430px] max-w-[1240px] grid-cols-[.7fr_1.3fr] px-[42px] max-[640px]:mx-[22px] max-[640px]:mb-[72px] max-[640px]:grid-cols-1 max-[640px]:px-0"
    >
      <div className="flex flex-col items-start justify-center bg-sand p-[clamp(38px,5vw,70px)] max-[640px]:px-[26px] max-[640px]:py-[38px]">
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage">Plan your visit</span>
        <h2 className="text-[clamp(30px,3vw,43px)] font-bold leading-[1.14] tracking-[-.035em] text-forest">
          Find us in
          <br />
          Pandan, Antique
        </h2>
        <p className="mb-[26px] mt-5 max-w-[350px] text-[13px] leading-[1.7] text-[#66776f]">
          Use the map to view the location and plan your route to MW Dumagat River Resort.
        </p>
        <a
          href="https://www.google.com/maps/search/?api=1&query=MW+Dumagat+River+Resort+Pandan+Antique"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-[9px] rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white no-underline hover:-translate-y-px hover:brightness-105"
        >
          <Icon name="pin" size={17} /> Open in Google Maps
        </a>
      </div>
      <div className="min-h-[430px] bg-[#dfe5dc] max-[640px]:min-h-[340px]">
        <iframe
          title="Map location of MW Dumagat River Resort in Pandan, Antique"
          src="https://www.google.com/maps?q=MW%20Dumagat%20River%20Resort%2C%20Pandan%2C%20Antique&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-full min-h-[430px] w-full border-0 [filter:saturate(.72)_contrast(.96)] max-[640px]:min-h-[340px]"
        />
      </div>
    </section>
  )
}