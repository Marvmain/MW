import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AdminLogin from './AdminLogin'
import AdminLayout from './admin/AdminLayout'
import CottagesAdmin from './admin/CottagesAdmin'
import ActivitiesAdmin from './admin/ActivitiesAdmin'
import type { AdminTab } from './admin/AdminLayout'

type Access = 'checking' | 'staff' | 'denied'
type AccessResult = Exclude<Access, 'checking'>

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessResult, setAccessResult] = useState<{ userId: string; access: AccessResult } | null>(null)
  const [tab, setTab] = useState<AdminTab>('cottages')
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return

    let active = true
    supabase
      .from('staff')
      .select('user_id')
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) {
          setAccessResult({ userId, access: !error && data ? 'staff' : 'denied' })
        }
      })

    return () => {
      active = false
    }
  }, [userId])

  const shell = 'grid min-h-screen place-items-center bg-cream p-5 text-forest'

  if (loading) return <main className={shell}>Loading…</main>
  if (!session) return <AdminLogin />
  if (!accessResult || accessResult.userId !== session.user.id) {
    return <main className={shell}>Checking access…</main>
  }

  if (accessResult.access === 'denied') {
    return (
      <main className={shell}>
        <div className="max-w-105 bg-paper p-9 text-center">
          <h1 className="mb-3 text-2xl font-bold tracking-[-.03em]">No staff access</h1>
          <p className="mb-6 text-sm leading-relaxed text-[#67766f]">
            This account is not on the staff list. Ask the resort owner to add you.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="min-h-11 rounded-[3px] bg-forest px-5.5 text-[13px] font-bold text-white">
            Sign out
          </button>
        </div>
      </main>
    )
  }

   return (
    <AdminLayout email={session.user.email ?? ''} tab={tab} onTab={setTab} onSignOut={() => supabase.auth.signOut()}>
      {tab === 'cottages' ? <CottagesAdmin /> : <ActivitiesAdmin />}
    </AdminLayout>
  )
}