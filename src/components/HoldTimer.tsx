import { formatRemaining, useCountdown } from '../lib/useCountdown'
import Icon from './Icon'

export default function HoldTimer({ expiresAt }: { expiresAt: string }) {
  const remaining = useCountdown(expiresAt)
  const expired = remaining === 0
  const urgent = !expired && remaining < 10 * 60 * 1000

  return (
    <p
      role="timer"
      aria-live="off"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
        expired ? 'bg-[#eceeed] text-[#6f7d76]' : urgent ? 'bg-[#fde8dc] text-[#ae4f2a]' : 'bg-[#fff1dc] text-[#a6672f]'
      }`}
    >
      <Icon name="clock" size={14} />
      {expired ? 'Hold expired' : `Hold expires in ${formatRemaining(remaining)}`}
    </p>
  )
}