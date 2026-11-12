import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useVerificationCount } from '../lib/useVerificationCount'
import AdminLogin from './AdminLogin'
import AdminLayout, { type AdminTab } from './admin/AdminLayout'
import ReservationsAdmin from './admin/ReservationsAdmin'
import CottagesAdmin from './admin/CottagesAdmin'
import ActivitiesAdmin from './admin/ActivitiesAdmin'

type Access = 'checking' | 'staff' | 'denied'

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<Access>('checking')
  const [tab, setTab] = useState<AdminTab>('reservations')
  const pending = useVerificationCount(access === 'staff')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return

    supabase
      .from('staff')
      .select('user_id')
      .maybeSingle()
      .then(({ data, error }) => setAccess(!error && data ? 'staff' : 'denied'))
  }, [session?.user.id])

  // Show the number of reservations waiting for verification in the browser tab
  useEffect(() => {
    const base = 'Admin · MW Dumagat'
    document.title = pending > 0 ? `(${pending}) ${base}` : base
    return () => {
      document.title = 'MW Dumagat River Resort'
    }
  }, [pending])

  const shell = 'grid min-h-screen place-items-center bg-cream p-5 text-forest'

  if (loading) return <main className={shell}>Loading…</main>
  if (!session) return <AdminLogin />
  if (access === 'checking') return <main className={shell}>Checking access…</main>

  if (access === 'denied') {
    return (
      <main className={shell}>
        <div className="max-w-[420px] bg-paper p-9 text-center">
          <h1 className="mb-3 text-2xl font-bold tracking-[-.03em]">No staff access</h1>
          <p className="mb-6 text-sm leading-relaxed text-[#67766f]">
            This account is not on the staff list. Ask the resort owner to add you.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="min-h-11 rounded-[3px] bg-forest px-[22px] text-[13px] font-bold text-white">
            Sign out
          </button>
        </div>
      </main>
    )
  }

  return (
    <AdminLayout
      email={session.user.email ?? ''}
      tab={tab}
      onTab={setTab}
      onSignOut={() => supabase.auth.signOut()}
      badges={{ reservations: pending }}
    >
      {tab === 'reservations' ? <ReservationsAdmin /> : tab === 'cottages' ? <CottagesAdmin /> : <ActivitiesAdmin />}
    </AdminLayout>
  )
}