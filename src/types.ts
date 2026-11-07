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
  activities: { name: string; option: string | null; quantity: number; line_total: number }[]
}