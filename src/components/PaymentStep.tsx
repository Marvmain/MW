import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { checkProof, submitPaymentProof } from '../lib/proofs'
import { peso } from '../lib/money'
import type { PaymentMethod } from '../types'
import Icon from './Icon'

type Props = {
  reservationId: string
  downpayment: number
  holdTime: string
  onUploaded: () => void
}

export default function PaymentStep({ reservationId, downpayment, holdTime, onUploaded }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase
      .from('payment_methods')
      .select('*')
      .order('sort_order')
      .order('created_at')
      .then(({ data }) => {
        if (!cancelled && data) setMethods(data as PaymentMethod[])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function onPickFile(f: File | null) {
    setFile(f)
    setUploadError(f ? checkProof(f) ?? '' : '')
  }

  async function sendProof(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const problem = checkProof(file)
    if (problem) return setUploadError(problem)
    setUploading(true)
    setUploadError('')
    try {
      await submitPaymentProof(reservationId, file)
      onUploaded()
    } catch (err) {
      setUploadError((err as Error).message)
    }
    setUploading(false)
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div>
      <div className="mb-5 bg-white p-4 text-[12px] text-[#465e54]">
        <div className="flex justify-between text-forest">
          <span className="font-bold">Please send (30% downpayment)</span>
          <strong className="text-[15px]">{peso(Math.round(downpayment * 100))}</strong>
        </div>
        <p className="mt-1.5 text-[11px] text-[#8a958f]">Upload your proof before {holdTime}, or the hold is released.</p>
      </div>

      <div className="mb-5">
        <span className="flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]">How to pay</span>
        {methods.length === 0 ? (
          <p className="mt-[7px] border border-[#d8d5cc] bg-white p-3 text-[12px] text-[#728078]">
            Payment details are not available right now. Please contact the resort to get them, then upload your proof here.
          </p>
        ) : (
          <div className="mt-[7px] grid gap-2">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 border border-[#d8d5cc] bg-white p-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-forest">{m.label}</p>
                  <p className="text-[12px] text-[#728078]">{m.account_name}</p>
                  <p className="text-[13px] font-semibold tracking-[.04em] text-forest">{m.account_number}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(m.account_number)}
                  className="h-[33px] shrink-0 rounded-[3px] border border-[#d7ddd8] bg-white px-3 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3]"
                >
                  {copied === m.account_number ? 'Copied' : 'Copy number'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={sendProof} noValidate>
        <label className="relative flex cursor-pointer items-center gap-3 border border-dashed border-[#aab5ae] bg-white p-4 focus-within:border-[#30624d]">
          <Icon name="upload" />
          <span className="flex min-w-0 flex-col gap-[3px]">
            <strong className="text-[12px] text-[#465e54]">{file ? file.name : 'Upload your payment proof'}</strong>
            <small className="text-[11px] text-[#8b9690]">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'JPG, PNG, WebP or PDF · up to 5 MB'}
            </small>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            aria-label="Payment proof"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        {uploadError && <p role="alert" className="mt-3 text-[12px] font-semibold text-[#ae673c]">{uploadError}</p>}
        <button
          type="submit"
          disabled={!file || uploading || !!uploadError}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-[9px] rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Submit payment proof'} <Icon name="arrow" />
        </button>
      </form>
    </div>
  )
}