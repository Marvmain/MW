import type { TrackedReservation } from '../types'

const STEPS = ['Booking', 'Payment proof', 'Verification', 'Check-in']

function reachedIndex(status: TrackedReservation['status']) {
  switch (status) {
    case 'for_verification':
      return 1
    case 'confirmed':
      return 2
    case 'checked_in':
      return 3
    default:
      return 0
  }
}

export default function StatusTimeline({ status, rejected }: { status: TrackedReservation['status']; rejected: boolean }) {
  const stopped = status === 'cancelled' || status === 'expired'
  const reached = reachedIndex(status)

  return (
    <div className="mb-6">
      <ol className="grid grid-cols-4" aria-label="Reservation progress">
        {STEPS.map((label, i) => {
          const done = stopped ? i === 0 : i <= reached
          const current = !stopped && i === reached + 1
          const warn = current && i === 1 && rejected
          const leftDone = !stopped && i <= reached
          const rightDone = !stopped && i + 1 <= reached

          const circle = done
            ? 'bg-[#285444] text-white'
            : warn
              ? 'border-2 border-[#ae673c] bg-[#fff1dc] text-[#ae673c]'
              : current
                ? 'border-2 border-[#c99151] bg-white'
                : 'border border-[#d8d3ca] bg-white text-[#9aa39f]'
          const text = done ? 'text-[#285444]' : warn ? 'text-[#ae673c]' : current ? 'text-[#a6672f]' : 'text-[#9aa39f]'

          return (
            <li key={label} aria-current={current ? 'step' : undefined} className="relative flex flex-col items-center gap-2 text-center">
              {i > 0 && (
                <span aria-hidden="true" className={`absolute left-0 right-1/2 top-[13px] h-0.5 -translate-y-1/2 transition-colors duration-500 ${leftDone ? 'bg-[#285444]' : 'bg-[#d8d3ca]'}`} />
              )}
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={`absolute left-1/2 right-0 top-[13px] h-0.5 -translate-y-1/2 transition-colors duration-500 ${rightDone ? 'bg-[#285444]' : 'bg-[#d8d3ca]'}`} />
              )}
              <span className={`relative z-10 grid h-[26px] w-[26px] place-items-center rounded-full text-[10px] font-bold ${circle}`}>
                {done ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : warn ? (
                  '!'
                ) : current ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#c99151]" />
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-[10px] font-semibold leading-tight ${text}`}>{warn ? 'Proof rejected' : label}</span>
            </li>
          )
        })}
      </ol>
      {stopped && (
        <p className="mt-3 text-center text-[11px] font-bold text-[#6f7d76]">
          {status === 'cancelled' ? 'This reservation was cancelled.' : 'The hold on this reservation expired.'}
        </p>
      )}
    </div>
  )
}