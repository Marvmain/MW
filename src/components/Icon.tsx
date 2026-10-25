export type IconName = 'bed' | 'bike' | 'leaf' | 'arrow' | 'menu' | 'close' | 'home' | 'calendar'

const paths: Record<IconName, React.ReactNode> = {
  bed: <path d="M2 20v-8M22 20v-5a3 3 0 0 0-3-3H2v8M6 12V7h6a3 3 0 0 1 3 3v2M2 17h20" />,
  bike: (
    <>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6h-3l-3 7 4 1 3-5 2.5 8.5M9 13 5.5 8H3M12 6l-1-2h3" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 2 22 3 22 3s1 6.5-3.1 12.2A7 7 0 0 1 11 20Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6.94C9.77 12.74 13.5 12 18 12" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,

    home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
}

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}