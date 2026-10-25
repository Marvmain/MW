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