import Reveal from './Reveal'

const steps = [
  { n: '01', title: 'Choose your cottage', text: 'Pick one or more cottages and optional activities for today.' },
  { n: '02', title: 'Send 30% downpayment', text: 'Upload a clear copy of your payment proof.' },
  { n: '03', title: 'Wait for confirmation', text: 'Our staff will verify your payment and reservation.' },
  { n: '04', title: 'Show your reference', text: 'Present your reference number when you arrive at the resort.' },
]

export default function ProcessSection() {
  return (
    <section id="steps" className="mx-auto max-w-[1240px] px-[42px] py-[100px] max-[640px]:px-[22px] max-[640px]:py-[72px]">
      <Reveal className="mb-[42px] max-[640px]:mb-[30px]">
        <div className="flex items-end justify-between gap-10 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-4">
          <div className="max-w-[590px]">
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.18em] text-sage">Easy from booking to arrival</span>
            <h2 className="text-[clamp(32px,3.5vw,46px)] font-bold leading-[1.14] tracking-[-.035em] text-forest">
              Your visit, in four simple steps
            </h2>
          </div>
          <p className="max-w-[390px] text-sm leading-[1.7] text-[#67766f]">
            No account needed. Keep your reference number to track your reservation anytime with “My booking”.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-4 border-t border-[#d8d3c9] max-[640px]:grid-cols-2 max-[640px]:gap-x-3 max-[640px]:gap-y-[30px]">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 110}>
            <div className="relative pr-7 pt-7 before:absolute before:-top-[3px] before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#2b5a46] before:content-['']">
              <span className="text-[10px] font-bold tracking-[.15em] text-[#819069]">{s.n}</span>
              <h3 className="mb-[9px] mt-5 text-[17px] font-bold tracking-[-.015em] text-forest">{s.title}</h3>
              <p className="max-w-[220px] text-xs leading-[1.6] text-[#75817b]">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}