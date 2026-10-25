import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { checkImage, imageUrl, removeImage, uploadImage } from '../../lib/images'
import type { Activity } from '../../types'

type FormState = {
  name: string
  option: string
  price: string
  price_note: string
  stock: string
  is_active: boolean
}

const emptyForm: FormState = { name: '', option: '', price: '', price_note: '', stock: '', is_active: true }

function messageOf(err: unknown) {
  return (err as { message?: string })?.message ?? 'Please try again.'
}

export default function ActivitiesAdmin() {
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('sort_order')
      .order('created_at')
    if (error) setPageError('Could not load activities. ' + error.message)
    else {
      setPageError('')
      setItems(data as Activity[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchActivities() {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('sort_order')
        .order('created_at')
      if (cancelled) return
      if (error) setPageError('Could not load activities. ' + error.message)
      else {
        setPageError('')
        setItems(data as Activity[])
      }
      setLoading(false)
    }

    void fetchActivities()
    return () => {
      cancelled = true
    }
  }, [])

  function openForm(a: Activity | null) {
    setEditing(a)
    setForm(
      a
        ? { name: a.name, option: a.option ?? '', price: String(a.price), price_note: a.price_note ?? '', stock: a.stock === null ? '' : String(a.stock), is_active: a.is_active }
        : emptyForm,
    )
    setFile(null)
    setPreview(null)
    setFormError('')
    setOpen(true)
  }

  function closeForm() {
    if (preview) URL.revokeObjectURL(preview)
    setOpen(false)
  }

  function onPickFile(f: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
    setFormError(f ? checkImage(f) ?? '' : '')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const name = form.name.trim()
    const price = Number(form.price)
    const stockText = form.stock.trim()
    const stock = stockText === '' ? null : Number(stockText)
    if (!name) return setFormError('Name is required.')
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setFormError('Enter a valid price (0 or more). Use 0 for free.')
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return setFormError('Stock must be a whole number, 0 or more, or empty for unlimited.')
    if (file) {
      const msg = checkImage(file)
      if (msg) return setFormError(msg)
    }

    setSaving(true)
    let newPath: string | null = null
    try {
      if (file) newPath = await uploadImage('activities', file)
      const row = {
        name,
        option: form.option.trim() || null,
        price,
        price_note: form.price_note.trim() || null,
        stock,
        is_active: form.is_active,
        ...(newPath ? { image_path: newPath } : {}),
      }
      const { error } = editing
        ? await supabase.from('activities').update(row).eq('id', editing.id)
        : await supabase.from('activities').insert(row)
      if (error) throw error
      if (newPath && editing?.image_path) await removeImage(editing.image_path)
      closeForm()
      await load()
    } catch (err) {
      if (newPath) await removeImage(newPath)
      setFormError('Could not save. ' + messageOf(err))
    }
    setSaving(false)
  }

  async function toggle(a: Activity) {
    const { error } = await supabase.from('activities').update({ is_active: !a.is_active }).eq('id', a.id)
    if (error) setPageError('Could not update. ' + error.message)
    else load()
  }

  const inputClass = 'h-[43px] border border-[#d8d5cc] bg-white px-3 text-[13px] text-forest outline-none focus:border-[#30624d]'
  const labelClass = 'flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-.025em] text-[#1d3c31]">Activities</h1>
          <p className="mt-1 text-[12px] text-[#849089]">Guests only see activities that are switched on.</p>
        </div>
        <button onClick={() => openForm(null)} className="min-h-11 rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105">
          + Add activity
        </button>
      </div>

      {pageError && <p className="mb-4 border border-[#e8c9b8] bg-[#fff1dc] px-4 py-3 text-[12px] text-[#a6672f]">{pageError}</p>}
      {loading && <p className="text-[13px] text-[#849089]">Loading…</p>}
      {!loading && items.length === 0 && !pageError && (
        <p className="border border-dashed border-[#c9d1cb] bg-white px-6 py-10 text-center text-[13px] text-[#849089]">
          No activities yet. Click “Add activity” to create the first one.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((a) => {
          const url = imageUrl(a.image_path)
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-4 border border-[#dfe4df] bg-white p-4">
              <div className="h-[64px] w-[84px] shrink-0 overflow-hidden bg-[#e8efe8]">
                {url ? <img src={url} alt={a.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-[#9ba49f]">No photo</span>}
              </div>
              <div className="min-w-[160px] flex-1">
                <strong className="text-[14px] text-[#263f36]">{a.name}</strong>
                {a.option && <span className="text-[12px] text-[#75817b]"> · {a.option}</span>}
                <p className="mt-1 text-[12px] text-[#75817b]">
                  {a.price === 0 ? 'Free' : `₱${a.price.toLocaleString()}`}
                  {a.price_note ? ` · ${a.price_note}` : ''} · {a.stock === null ? 'Unlimited' : `${a.stock} in stock`}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${a.is_active ? 'bg-[#e3eee4] text-[#2f694d]' : 'bg-[#eceeed] text-[#6f7d76]'}`}>
                {a.is_active ? 'On' : 'Off'}
              </span>
              <button onClick={() => toggle(a)} className="h-[33px] rounded-[3px] border border-[#d7ddd8] bg-white px-3 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3]">
                {a.is_active ? 'Turn off' : 'Turn on'}
              </button>
              <button onClick={() => openForm(a)} className="h-[33px] rounded-[3px] border border-[#d7ddd8] bg-white px-3 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3]">
                Edit
              </button>
            </div>
          )
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(11,30,23,.72)] p-5" role="dialog" aria-modal="true">
          <form onSubmit={save} className="max-h-[94vh] w-full max-w-[640px] overflow-y-auto bg-paper p-6 shadow-[0_30px_80px_rgba(0,0,0,.25)] min-[641px]:p-9">
            <h2 className="mb-6 text-[26px] font-bold tracking-[-.035em] text-forest">{editing ? 'Edit activity' : 'Add activity'}</h2>

            <div className="grid gap-4 min-[641px]:grid-cols-2">
              <label className={labelClass}>
                Name
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kayak" />
              </label>
              <label className={labelClass}>
                Option (optional)
                <input className={inputClass} value={form.option} onChange={(e) => setForm({ ...form, option: e.target.value })} placeholder="e.g. Double" />
              </label>
              <label className={labelClass}>
                Price (₱, use 0 for free)
                <input className={inputClass} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
              <label className={labelClass}>
                Price note (optional)
                <input className={inputClass} value={form.price_note} onChange={(e) => setForm({ ...form, price_note: e.target.value })} placeholder="e.g. Per hour" />
              </label>
              <label className={labelClass}>
                Stock (empty = unlimited)
                <input className={inputClass} type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </label>
              <label className="flex items-center gap-2 pt-6 text-[12px] font-bold text-[#465e54]">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
                Visible to guests
              </label>
            </div>

            <div className="mt-5">
              <span className={labelClass}>Photo (JPG, PNG or WebP, up to 5 MB)</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-[72px] w-[96px] shrink-0 overflow-hidden bg-[#e8efe8]">
                  {(preview || (editing && imageUrl(editing.image_path))) && (
                    <img src={preview ?? imageUrl(editing!.image_path)!} alt="Preview" className="h-full w-full object-cover" />
                  )}
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} className="text-[12px]" />
              </div>
            </div>

            {formError && <p className="mt-4 text-[12px] font-semibold text-[#ae673c]">{formError}</p>}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={closeForm} className="min-h-11 flex-1 rounded-[3px] border border-[#d7ddd8] bg-white text-[13px] font-bold text-[#466158]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-[3px] bg-green text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save activity'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}