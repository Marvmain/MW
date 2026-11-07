export function peso(cents: number) {
  return '₱' + (cents / 100).toLocaleString('en-PH', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })
}