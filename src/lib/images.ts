import { supabase } from './supabase'

const BUCKET = 'resort-images'
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export function imageUrl(path: string | null) {
  if (!path) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export function checkImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'Photo must be a JPG, PNG or WebP image.'
  if (file.size > MAX_BYTES) return 'Photo must be 5 MB or smaller.'
  return null
}

export async function uploadImage(folder: string, file: File) {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '3600' })
  if (error) throw error
  return path
}

export async function removeImage(path: string) {
  await supabase.storage.from(BUCKET).remove([path])
}