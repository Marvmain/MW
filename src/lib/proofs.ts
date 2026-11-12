import { supabase } from './supabase'

const BUCKET = 'payment-proofs'
const MAX_BYTES = 5 * 1024 * 1024
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export function checkProof(file: File): string | null {
  if (!EXT[file.type]) return 'Please upload a JPG, PNG, WebP image or a PDF.'
  if (file.size > MAX_BYTES) return 'The file must be 5 MB or smaller.'
  return null
}

export async function submitPaymentProof(reservationId: string, file: File): Promise<void> {
  const problem = checkProof(file)
  if (problem) throw new Error(problem)

  // A new random name for every attempt, so an old (rejected) file is never reused.
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  const path = `${reservationId}/proof-${suffix}.${EXT[file.type]}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) {
    console.error('Payment proof upload error:', error)
    throw new Error('We could not upload your file. Your reservation hold may have expired. Please try again.')
  }

  const { error: rpcError } = await supabase.rpc('attach_payment_proof', {
    p_reservation_id: reservationId,
    p_path: path,
  })
  if (rpcError) {
    console.error('attach_payment_proof error:', rpcError)
    throw new Error(rpcError.code === 'P0001' ? rpcError.message : 'We could not save your payment proof. Please try again.')
  }
}