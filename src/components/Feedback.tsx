import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useModal } from '../lib/useModal'

type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: number; message: string; kind: ToastKind }
type ConfirmOptions = { title: string; message: string; confirmLabel?: string; danger?: boolean }
type Feedback = {
  toast: (message: string, kind?: ToastKind) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<Feedback | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider')
  return ctx
}

const toastBorder: Record<ToastKind, string> = {
  success: 'border-[#9bc28a]',
  error: 'border-[#e0916a]',
  info: 'border-[#b7c9c2]',
}

function ConfirmDialog({
  options,
  onAnswer,
}: {
  options: ConfirmOptions
  onAnswer: (value: boolean) => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  useModal(panelRef, () => onAnswer(false))

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-[rgba(11,30,23,.72)] p-5" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div ref={panelRef} tabIndex={-1} className="w-full max-w-[440px] bg-paper p-7 shadow-[0_30px_80px_rgba(0,0,0,.25)] outline-none">
        <h2 id="confirm-title" className="text-[22px] font-bold tracking-[-.03em] text-forest">{options.title}</h2>
        <p className="mt-3 text-[13px] leading-[1.7] text-[#687870]">{options.message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="min-h-11 flex-1 rounded-[3px] border border-[#d7ddd8] bg-white text-[13px] font-bold text-[#466158]"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => onAnswer(true)}
            className={`min-h-11 flex-1 rounded-[3px] text-[13px] font-bold text-white hover:brightness-105 ${options.danger ? 'bg-[#ae673c]' : 'bg-green'}`}
          >
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [dialog, setDialog] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null)
  const nextId = useRef(1)

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++
    setToasts((list) => [...list.slice(-2), { id, message, kind }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3800)
  }, [])

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ options, resolve })),
    [],
  )

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])

  function answer(result: boolean) {
    dialog?.resolve(result)
    setDialog(null)
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {dialog && <ConfirmDialog options={dialog.options} onAnswer={answer} />}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[200] flex flex-col items-center gap-2 px-4 min-[641px]:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-[420px] animate-toast-in rounded border-l-4 bg-deep px-4 py-3 text-[12px] font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,.25)] motion-reduce:animate-none ${toastBorder[t.kind]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}