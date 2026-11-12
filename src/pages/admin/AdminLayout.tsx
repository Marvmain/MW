import BrandMark from '../../components/BrandMark'
import Icon, { type IconName } from '../../components/Icon'

export type AdminTab = 'reservations' | 'cottages' | 'activities'

const groups: { label: string; items: { id: AdminTab; label: string; icon: IconName }[] }[] = [
  { label: 'Workspace', items: [{ id: 'reservations', label: 'Reservations', icon: 'receipt' }] },
  {
    label: 'Manage',
    items: [
      { id: 'cottages', label: 'Cottages', icon: 'home' },
      { id: 'activities', label: 'Activities', icon: 'bike' },
    ],
  },
]

export default function AdminLayout({
  email,
  tab,
  onTab,
  onSignOut,
  badges = {},
  children,
}: {
  email: string
  tab: AdminTab
  onTab: (tab: AdminTab) => void
  onSignOut: () => void
  badges?: Partial<Record<AdminTab, number>>
  children: React.ReactNode
}) {
  const initials = (email.split('@')[0] || 'ST').slice(0, 2).toUpperCase()

  return (
    <div className="grid min-h-screen grid-cols-[236px_1fr] bg-[#f4f6f3] text-[#263c34] max-[900px]:grid-cols-[76px_1fr] max-[640px]:block">
      <aside className="flex flex-col bg-deep px-[18px] pb-5 pt-[27px] text-[#b7c9c2] min-[641px]:sticky min-[641px]:top-0 min-[641px]:h-screen min-[641px]:overflow-y-auto max-[900px]:px-2.5 max-[900px]:py-[22px] max-[640px]:fixed max-[640px]:inset-x-0 max-[640px]:bottom-0 max-[640px]:z-20 max-[640px]:h-[62px] max-[640px]:flex-row max-[640px]:px-[7px] max-[640px]:py-[7px]">
        <div className="inline-flex items-center gap-2.5 px-[7px] pb-[30px] text-white max-[900px]:justify-center max-[900px]:px-0 max-[900px]:pb-6 max-[640px]:hidden">
          <BrandMark />
          <span className="flex flex-col leading-none tracking-[.08em] max-[900px]:hidden">
            <strong className="text-sm font-bold">MW DUMAGAT</strong>
            <small className="mt-1 text-[8px] tracking-[.24em]">ADMIN PORTAL</small>
          </span>
        </div>

        <nav aria-label="Admin" className="flex flex-col gap-1 max-[640px]:w-full max-[640px]:flex-row max-[640px]:items-stretch max-[640px]:justify-around">
          {groups.map((group) => (
            <div key={group.label} className="contents">
              <div className="px-3 pb-2 pt-[18px] text-[9px] font-bold uppercase tracking-[.16em] text-[#789187] max-[900px]:hidden">
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = tab === item.id
                const badge = badges[item.id] ?? 0
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTab(item.id)}
                    aria-label={badge > 0 ? `${item.label}, ${badge} waiting` : item.label}
                    aria-current={active ? 'page' : undefined}
                    title={item.label}
                    className={`relative flex h-[42px] items-center gap-3 rounded px-3 text-left text-xs transition-colors max-[900px]:justify-center max-[900px]:px-0 max-[640px]:h-[48px] max-[640px]:flex-1 max-[640px]:flex-col max-[640px]:gap-0.5 ${
                      active ? 'bg-[#285444] text-white' : 'text-[#b7c9c2] hover:bg-[#285444] hover:text-white'
                    }`}
                  >
                    <Icon name={item.icon} size={19} />
                    <span className="hidden min-[901px]:inline">{item.label}</span>
                    <span className="hidden text-[9px] font-semibold max-[640px]:block">{item.label}</span>
                    {badge > 0 && (
                      <span
                        key={badge}
                        className="absolute right-1.5 top-1 grid h-[19px] min-w-[19px] animate-pop-in place-items-center rounded-full bg-[#c99151] px-1 text-[9px] font-bold text-white max-[640px]:right-[22%] min-[901px]:static min-[901px]:ml-auto"
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5 max-[640px]:hidden">
          <div className="flex items-center gap-2.5 px-2 pb-3 max-[900px]:justify-center max-[900px]:px-0">
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#7c926d] text-[10px] font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 max-[900px]:hidden">
              <strong className="block truncate text-[11px] text-white">{email}</strong>
              <small className="mt-[3px] block text-[9px] text-[#8ca399]">Resort staff</small>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-[38px] w-full items-center gap-2.5 rounded px-3 text-xs text-[#b7c9c2] hover:bg-[#285444] hover:text-white max-[900px]:justify-center max-[900px]:px-0"
          >
            <Icon name="logout" size={18} />
            <span className="max-[900px]:hidden">Sign out</span>
          </button>
          <a
            href="/"
            className="flex items-center justify-between px-2 pt-3 text-[10px] text-[#9bb1a8] no-underline hover:text-white max-[900px]:hidden"
          >
            View customer site <Icon name="arrow" size={15} />
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-[#dfe4df] bg-white px-4 py-3 min-[641px]:hidden">
          <div className="flex items-center gap-2 text-forest">
            <BrandMark />
            <span className="text-[11px] font-bold tracking-[.08em]">ADMIN PORTAL</span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded border border-[#d7ddd8] px-3 py-1.5 text-[11px] font-bold text-[#466158]"
          >
            Sign out
          </button>
        </div>
        <main className="mx-auto max-w-[1100px] px-5 py-8 min-[901px]:px-8 max-[640px]:pb-[90px]">{children}</main>
      </div>
    </div>
  )
}