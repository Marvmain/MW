import BrandMark from '../../components/BrandMark'

export type AdminTab = 'cottages' | 'activities'

export default function AdminLayout({
  email,
  tab,
  onTab,
  onSignOut,
  children,
}: {
  email: string
  tab: AdminTab
  onTab: (tab: AdminTab) => void
  onSignOut: () => void
  children: React.ReactNode
}) {
  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'cottages', label: 'Cottages' },
    { id: 'activities', label: 'Activities' },
  ]

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
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`rounded px-3 py-2 font-semibold ${tab === t.id ? 'bg-[#285444] text-white' : 'text-[#b7c9c2] hover:bg-[#285444]/60'}`}
            >
              {t.label}
            </button>
          ))}
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