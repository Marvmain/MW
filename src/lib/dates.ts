// Today's date in the Philippines, as YYYY-MM-DD
export function todayInManila(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatVisitDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}