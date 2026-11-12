import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { checkImage, imageUrl, removeImage, uploadImage } from '../../lib/images'
import type { Activity } from '../../types'
import Icon from '../../components/Icon'

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
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState<{ activity: Activity; top: number; right: number } | null>(null)
  const [photo, setPhoto] = useState<Activity | null>(null)
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

    const runLoad = async () => {
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

    void runLoad()

    return () => {
      cancelled = true
    }
  }, [])

  // Close the ⋯ menu on outside click, scroll, resize, or Escape
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  useEffect(() => {
    if (!photo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPhoto(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photo])

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, a: Activity) {
    e.stopPropagation()
    if (menu?.activity.id === a.id) return setMenu(null)
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu({ activity: a, top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

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

  async function deleteActivity(activity: Activity) {
    const label = activity.option ? `${activity.name} (${activity.option})` : activity.name
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return

    setMenu(null)
    setPageError('')
    const { error } = await supabase.from('activities').delete().eq('id', activity.id)
    if (error) {
      setPageError('Could not delete activity. ' + messageOf(error))
      return
    }
    if (activity.image_path) await removeImage(activity.image_path)
    await load()
  }

  const q = search.trim().toLowerCase()
  const visible = items.filter((a) => !q || a.name.toLowerCase().includes(q) || (a.option ?? '').toLowerCase().includes(q))
  const hiddenCount = items.filter((a) => !a.is_active).length

  const inputClass = 'h-[43px] border border-[#d8d5cc] bg-white px-3 text-[13px] text-forest outline-none focus:border-[#30624d]'
  const labelClass = 'flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]'
  const th = 'bg-[#fafbfa] px-[14px] py-3 text-[9px] font-bold uppercase tracking-[.1em] text-[#8d9892]'
  const td = 'px-[14px] py-[18px] text-[12px] text-[#607069]'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[.18em] text-sage">Resort catalog</span>
          <h1 className="text-[32px] font-bold leading-tight tracking-[-.03em] text-[#1d3c31]">Activities</h1>
          <p className="mt-2 text-[12px] text-[#849089]">Manage the activities, rates, and stock shown in the customer booking interface.</p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="min-h-11 rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105"
        >
          + Add activity
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-[#d5e0d4] bg-[#e4ede3] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#315e4b]">
            <Icon name="bike" size={20} />
          </span>
          <div>
            <small className="block text-[9px] font-bold uppercase tracking-[.1em] text-[#6f8579]">Total activities</small>
            <strong className="text-[24px] font-extrabold leading-tight text-[#1f4034]">{items.length}</strong>
          </div>
        </div>
        <p className="text-[11px] text-[#6f8579]">
          {hiddenCount === 0
            ? 'All listed activities are currently visible to guests.'
            : `${hiddenCount} ${hiddenCount === 1 ? 'activity is' : 'activities are'} hidden from guests.`}
        </p>
      </div>

      {pageError && <p className="mb-4 border border-[#e8c9b8] bg-[#fff1dc] px-4 py-3 text-[12px] text-[#a6672f]">{pageError}</p>}

      <div className="border border-[#dfe4df] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e8e4] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#263f36]">Activities list</h2>
            <p className="mt-1 text-[10px] text-[#87928c]">Current booking catalog</p>
          </div>
          <div className="relative w-[280px] max-[640px]:w-full">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8d9892]">
              <Icon name="search" size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities"
              aria-label="Search activities"
              className="h-[44px] w-full border border-[#d8d5cc] bg-white pl-10 pr-3 text-[12px] text-forest outline-none focus:border-[#30624d]"
            />
          </div>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-[13px] text-[#849089]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-[#849089]">No activities yet. Click “+ Add activity” to create the first one.</p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-[#849089]">No activities match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr>
                  <th className={th}>Activity</th>
                  <th className={th}>Option</th>
                  <th className={th}>Rate</th>
                  <th className={th}>Unit / note</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Visibility</th>
                  <th className={`${th} w-[60px]`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id} className="border-t border-[#edf0ed]">
                    <td className={`${td} font-bold text-[#263f36]`}>{a.name}</td>
                    <td className={td}>{a.option || '—'}</td>
                    <td className={`${td} font-bold text-[#263f36]`}>{a.price === 0 ? 'Free' : `₱${a.price.toLocaleString()}`}</td>
                    <td className={td}>{a.price_note || '—'}</td>
                    <td className={td}>{a.stock === null ? 'Unlimited' : a.stock}</td>
                    <td className={td}>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${a.is_active ? 'bg-[#e3eee4] text-[#2f694d]' : 'bg-[#eceeed] text-[#6f7d76]'}`}
                      >
                        {a.is_active ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        onClick={(e) => openMenu(e, a)}
                        aria-label={`Actions for ${a.name}${a.option ? ' ' + a.option : ''}`}
                        aria-haspopup="menu"
                        aria-expanded={menu?.activity.id === a.id}
                        className="grid h-8 w-8 place-items-center rounded text-[#88958f] hover:bg-[#f4f6f3]"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <circle cx="5" cy="12" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="19" cy="12" r="1.8" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {menu && (
        <div
          role="menu"
          style={{ top: menu.top, right: menu.right }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-40 w-[150px] overflow-hidden rounded border border-[#dfe4df] bg-white py-1 shadow-[0_12px_30px_rgba(31,54,44,.15)]"
        >
          <button
            role="menuitem"
            onClick={() => {
              setPhoto(menu.activity)
              setMenu(null)
            }}
            className="block w-full px-4 py-2.5 text-left text-[12px] font-semibold text-[#466158] hover:bg-[#f4f6f3]"
          >
            View photo
          </button>
          <button
            role="menuitem"
            onClick={() => {
              openForm(menu.activity)
              setMenu(null)
            }}
            className="block w-full px-4 py-2.5 text-left text-[12px] font-semibold text-[#466158] hover:bg-[#f4f6f3]"
          >
            Edit
          </button>
          <button
            role="menuitem"
            onClick={() => void deleteActivity(menu.activity)}
            className="block w-full px-4 py-2.5 text-left text-[12px] font-semibold text-[#a3483b] hover:bg-[#fff3f1]"
          >
            Delete
          </button>
        </div>
      )}

      {photo && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[rgba(11,30,23,.8)] p-5"
          role="dialog"
          aria-modal="true"
          onClick={() => setPhoto(null)}
        >
          <div className="max-h-[94vh] w-full max-w-[720px] overflow-y-auto bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <strong className="text-[14px] text-forest">
                {photo.name}
                {photo.option ? ` · ${photo.option}` : ''}
              </strong>
              <button
                onClick={() => setPhoto(null)}
                className="rounded border border-[#d7ddd8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#466158]"
              >
                Close
              </button>
            </div>
            {imageUrl(photo.image_path) ? (
              <img src={imageUrl(photo.image_path)!} alt={photo.name} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
            ) : (
              <p className="border border-dashed border-[#c9d1cb] bg-white px-6 py-10 text-center text-[13px] text-[#849089]">
                No photo uploaded yet. Use “Edit” to add one.
              </p>
            )}
          </div>
        </div>
      )}

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