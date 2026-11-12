import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useReservationChanges } from './useReservationChanges'

// Number of reservations waiting for staff to verify the payment proof.
export function useVerificationCount(enabled: boolean) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const { count: n, error } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'for_verification')
    if (!error) setCount(n ?? 0)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const initialRefresh = window.setTimeout(() => {
      void refresh()
    }, 0)

    const timer = window.setInterval(() => {
      void refresh()
    }, 60000)

    return () => {
      window.clearTimeout(initialRefresh)
      window.clearInterval(timer)
    }
  }, [enabled, refresh])

  useReservationChanges(enabled, () => void refresh(), 'reservations-count')

  return count
}