import BrandMark from '../../components/BrandMark'

export default function AdminLayout({
  email,
  onSignOut,
  children,
}: {
  email: string
  onSignOut: () => void
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#263c34]">
      <header className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 bg-deep px-5 py-3 text-white min-[901px]:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="flex flex-col leading-none tracking-[.08em]">
            <strong className="text-sm font-bold">MW DUMAGAT</strong>
            <small className="mt-1 text-[8px] tracking-[.24em]">ADMIN PORTAL</small>
          </span>
        </div>
        <nav className="flex items-center gap-1 text-[12px]">
          <span className="rounded bg-[#285444] px-3 py-2 font-semibold">Cottages</span>
          <span className="px-3 py-2 text-[#8ca399]">Activities (next)</span>
        </nav>
        <div className="flex items-center gap-3 text-[11px] text-[#b7c9c2]">
          <span className="hidden min-[641px]:inline">{email}</span>
          <button onClick={onSignOut} className="rounded border border-white/30 px-3 py-2 font-semibold text-white hover:bg-white/10">
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-5 py-8 min-[901px]:px-8">{children}</main>
    </div>
  )
}