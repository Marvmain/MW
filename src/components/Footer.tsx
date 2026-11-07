import BrandMark from './BrandMark'

export default function Footer() {
  return (
    <footer className="flex min-h-[130px] items-center justify-between bg-deep px-[clamp(24px,8vw,124px)] py-[30px] text-white max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-6">
      <a href="#top" className="inline-flex items-center gap-2.5 text-white no-underline">
        <BrandMark />
        <span className="flex flex-col leading-none tracking-[.08em]">
          <strong className="text-sm font-bold">MW DUMAGAT</strong>
          <small className="mt-1 text-[8px] tracking-[.24em]">RIVER RESORT</small>
        </span>
      </a>
      <p className="text-xs text-[#a9beb5]">Pandan, Antique · A simple place by the river.</p>
    </footer>
  )
}