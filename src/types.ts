export type Cottage = {
  id: string
  name: string
  option: string | null
  price: number
  price_note: string | null
  units: number
  image_path: string | null
  is_active: boolean
  sort_order: number
}
export type Activity = {
  id: string
  name: string
  option: string | null
  price: number
  price_note: string | null
  stock: number | null
  image_path: string | null
  is_active: boolean
  sort_order: number
}
export type CottageAvailability = {
  cottage_id: string
  units: number
  booked: number
  remaining: number
}

export type AvailabilityResult = {
  date: string
  rows: CottageAvailability[]
}
export type ReservationResult = {
  reservation_id: string
  reference: string
  total: number
  downpayment: number
  balance: number
  hold_expires_at: string
}
export type PaymentMethod = {
  id: string
  label: string
  account_name: string
  account_number: string
  is_active: boolean
  sort_order: number
}
export type TrackedReservation = {
  reservation_id: string | null
  reference: string
  status: 'pending_proof' | 'expired' | 'for_verification' | 'confirmed' | 'checked_in' | 'cancelled'
  visit_date: string
  guest_name: string
  guests_count: number
  cottages: { name: string; option: string | null; quantity: number; line_total: number }[]
  total: number
  downpayment: number
  balance: number
  hold_expires_at: string
  can_upload: boolean
  proof_uploaded: boolean
  rejection_reason: string | null
  activities: { name: string; option: string | null; quantity: number; line_total: number }[]
}
export type ReservationRow = {
  id: string
  reference_code: string
  status: 'pending_proof' | 'for_verification' | 'confirmed' | 'checked_in' | 'cancelled'
  visit_date: string
  guest_name: string
  guest_phone: string
  guests_count: number
  cottage_price: number
  activities_total: number
  total_amount: number
  downpayment_amount: number
  hold_expires_at: string
  payment_proof_path: string | null
  proof_uploaded_at: string | null
  rejection_reason: string | null
  created_at: string
  reservation_cottages: { quantity: number; line_total: number; cottages: { name: string; option: string | null } | null }[]
  reservation_activities: { quantity: number; line_total: number; activities: { name: string; option: string | null } | null }[]
}