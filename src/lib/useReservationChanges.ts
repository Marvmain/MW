import { useEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type ReservationChange = RealtimePostgresChangesPayload<Record<string, unknown>>

// Calls onChange whenever a reservation is added, updated or removed.
// Only signed-in staff receive these events (row-level security applies).
export function useReservationChanges(enabled: boolean, onChange: (change: ReservationChange) => void, name: string) {
  const handler = useRef(onChange)
  useEffect(() => {
    handler.current = onChange
  })

  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel(name)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => handler.current(payload))
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, name])
}