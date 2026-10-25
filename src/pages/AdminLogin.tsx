import { useState } from 'react'
import { supabase } from '../lib/supabase'
import BrandMark from '../components/BrandMark'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Incorrect email or password.')
    setBusy(false)
  }

  const inputClass =
    'h-[43px] border border-[#d8d5cc] bg-white px-3 text-[13px] text-forest outline-none focus:border-[#30624d]'
  const labelClass = 'mb-4 flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]'

  return (
    <main className="grid min-h-screen place-items-center bg-cream p-5">
      <div className="w-full max-w-[420px] bg-paper p-9 shadow-[0_30px_80px_rgba(0,0,0,.12)]">
        <div className="mb-7 flex items-center gap-2.5 text-forest">
          <BrandMark />
          <span className="flex flex-col leading-none tracking-[.08em]">
            <strong className="text-sm font-bold">MW DUMAGAT</strong>
            <small className="mt-1 text-[8px] tracking-[.24em]">STAFF PORTAL</small>
          </span>
        </div>
        <h1 className="mb-6 text-[28px] font-bold leading-tight tracking-[-.035em] text-forest">Staff sign in</h1>
        <form onSubmit={handleSubmit}>
          <label className={labelClass}>
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </label>
          {error && <p className="mb-4 text-[12px] font-semibold text-[#ae673c]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 w-full rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}