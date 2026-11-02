import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { checkImage, imageUrl, removeImage, uploadImage } from '../../lib/images'
import type { Cottage } from '../../types'

type FormState = {
  name: string
  option: string
  price: string
  price_note: string
  units: string
  is_active: boolean
}

const emptyForm: FormState = { name: '', option: '', price: '', price_note: 'Per day', units: '1', is_active: true }

function messageOf(err: unknown) {
  return (err as { message?: string })?.message ?? 'Please try again.'
}


export default function CottagesAdmin() {
  const [items, setItems] = useState<Cottage[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Cottage | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cottages')
      .select('*')
      .order('sort_order')
      .order('created_at')
    if (error) setPageError('Could not load cottages. ' + error.message)
    else {
      setPageError('')
      setItems(data as Cottage[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    const run = async () => {
      const { data, error } = await supabase
        .from('cottages')
        .select('*')
        .order('sort_order')
        .order('created_at')

      if (!active) return

      if (error) setPageError('Could not load cottages. ' + error.message)
      else {
        setPageError('')
        setItems(data as Cottage[])
      }
      setLoading(false)
    }

    void run()

    return () => {
      active = false
    }
  }, [])

  function openForm(c: Cottage | null) {
    setEditing(c)
    setForm(
      c
        ? { name: c.name, option: c.option ?? '', price: String(c.price), price_note: c.price_note ?? '', units: String(c.units), is_active: c.is_active }
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

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) onPickFile(droppedFile)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const name = form.name.trim()
    const price = Number(form.price)
    const units = Number(form.units)
    if (!name) return setFormError('Name is required.')
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setFormError('Enter a valid price (0 or more).')
    if (!Number.isInteger(units) || units < 1) return setFormError('Units must be a whole number, 1 or more.')
    if (file) {
      const msg = checkImage(file)
      if (msg) return setFormError(msg)
    }

    setSaving(true)
    let newPath: string | null = null
    try {
      if (file) newPath = await uploadImage('cottages', file)
      const row = {
        name,
        option: form.option.trim() || null,
        price,
        price_note: form.price_note.trim() || null,
        units,
        is_active: form.is_active,
        ...(newPath ? { image_path: newPath } : {}),
      }
      const { error } = editing
        ? await supabase.from('cottages').update(row).eq('id', editing.id)
        : await supabase.from('cottages').insert(row)
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

  async function toggle(c: Cottage) {
    const { error } = await supabase.from('cottages').update({ is_active: !c.is_active }).eq('id', c.id)
    if (error) setPageError('Could not update. ' + error.message)
    else load()
  }

  const inputClass = 'h-[43px] border border-[#d8d5cc] bg-white px-3 text-[13px] text-forest outline-none focus:border-[#30624d]'
  const labelClass = 'flex flex-col gap-[7px] text-[11px] font-bold text-[#465e54]'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-.025em] text-[#1d3c31]">Cottages</h1>
          <p className="mt-1 text-[12px] text-[#849089]">Guests only see cottages that are switched on.</p>
        </div>
        <button onClick={() => openForm(null)} className="min-h-11 rounded-[3px] bg-green px-[22px] text-[13px] font-bold text-white hover:brightness-105">
          + Add cottage
        </button>
      </div>

      {pageError && <p className="mb-4 border border-[#e8c9b8] bg-[#fff1dc] px-4 py-3 text-[12px] text-[#a6672f]">{pageError}</p>}
      {loading && <p className="text-[13px] text-[#849089]">Loading…</p>}
      {!loading && items.length === 0 && !pageError && (
        <p className="border border-dashed border-[#c9d1cb] bg-white px-6 py-10 text-center text-[13px] text-[#849089]">
          No cottages yet. Click “Add cottage” to create the first one.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((c) => {
          const url = imageUrl(c.image_path)
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-4 border border-[#dfe4df] bg-white p-4">
              <div className="h-[64px] w-[84px] shrink-0 overflow-hidden bg-[#e8efe8]">
                {url ? <img src={url} alt={c.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-[#9ba49f]">No photo</span>}
              </div>
              <div className="min-w-[160px] flex-1">
                <strong className="text-[14px] text-[#263f36]">{c.name}</strong>
                {c.option && <span className="text-[12px] text-[#75817b]"> · {c.option}</span>}
                <p className="mt-1 text-[12px] text-[#75817b]">
                  ₱{c.price.toLocaleString()} {c.price_note ? `· ${c.price_note}` : ''} · {c.units} {c.units === 1 ? 'unit' : 'units'}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.is_active ? 'bg-[#e3eee4] text-[#2f694d]' : 'bg-[#eceeed] text-[#6f7d76]'}`}>
                {c.is_active ? 'On' : 'Off'}
              </span>
              <button onClick={() => toggle(c)} className="h-[33px] rounded-[3px] border border-[#d7ddd8] bg-white px-3 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3]">
                {c.is_active ? 'Turn off' : 'Turn on'}
              </button>
              <button onClick={() => openForm(c)} className="h-[33px] rounded-[3px] border border-[#d7ddd8] bg-white px-3 text-[11px] font-bold text-[#466158] hover:bg-[#f4f6f3]">
                Edit
              </button>
            </div>
          )
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(11,30,23,.72)] p-5" role="dialog" aria-modal="true">
          <form onSubmit={save} className="max-h-[94vh] w-full max-w-[640px] overflow-y-auto bg-paper p-6 shadow-[0_30px_80px_rgba(0,0,0,.25)] min-[641px]:p-9">
            <h2 className="mb-6 text-[26px] font-bold tracking-[-.035em] text-forest">{editing ? 'Edit cottage' : 'Add cottage'}</h2>

            <div className="grid gap-4 min-[641px]:grid-cols-2">
              <label className={labelClass}>
                Name
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kubo" />
              </label>
              <label className={labelClass}>
                Option (optional)
                <input className={inputClass} value={form.option} onChange={(e) => setForm({ ...form, option: e.target.value })} placeholder="e.g. Big" />
              </label>
              <label className={labelClass}>
                Price (₱)
                <input className={inputClass} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
              <label className={labelClass}>
                Price note (optional)
                <input className={inputClass} value={form.price_note} onChange={(e) => setForm({ ...form, price_note: e.target.value })} />
              </label>
              <label className={labelClass}>
                Units (how many of this cottage)
                <input className={inputClass} type="number" min="1" step="1" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
              </label>
              <label className="flex items-center gap-2 pt-6 text-[12px] font-bold text-[#465e54]">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
                Visible to guests
              </label>
            </div>

            <div className="mt-6">
              <div className="mb-3">
                <span className={labelClass}>Cottage Photo</span>
                <p className="mt-1 text-xs text-[#849089]">Upload an image to showcase this cottage.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label
                  htmlFor="photo-upload"
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`relative flex min-h-[230px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
                    isDragging
                      ? 'scale-[1.02] border-[#30624d] bg-[#e3eee4]'
                      : 'border-[#c9d1cb] bg-[#f7f9f6] hover:border-[#30624d] hover:bg-[#f0f5ef]'
                  }`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e3eee4] text-[#30624d] shadow-sm transition-transform duration-300 hover:scale-110">
                    <svg
                      width="34"
                      height="34"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 16V4" />
                      <path d="m7 9 5-5 5 5" />
                      <path d="M20 16.5v2A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-2" />
                    </svg>
                  </div>

                  <h3 className="text-sm font-semibold text-[#263f36]">
                    {isDragging ? 'Drop your image here' : 'Upload your image'}
                  </h3>
                  <p className="mt-2 text-xs text-[#849089]">Drag and drop your file here or</p>
                  <span className="mt-4 rounded-lg bg-green px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105">
                    Browse Files
                  </span>
                  <p className="mt-4 text-[10px] text-[#849089]">JPG, PNG or WebP · Maximum 5 MB</p>

                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      onPickFile(e.target.files?.[0] ?? null)
                      e.target.value = ''
                    }}
                    className="sr-only"
                  />
                </label>

                <div className="flex min-h-[230px] flex-col rounded-xl border border-[#dfe4df] bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#263f36]">Image Preview</h3>
                      <p className="mt-1 text-[10px] text-[#849089]">Preview your selected photo</p>
                    </div>
                    {(preview || (editing && imageUrl(editing.image_path))) && (
                      <span className="rounded-full bg-[#e3eee4] px-3 py-1 text-[10px] font-semibold text-[#2f694d]">Ready</span>
                    )}
                  </div>

                  <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-[#f7f9f6]">
                    {(preview || (editing && imageUrl(editing.image_path))) ? (
                      <img
                        src={preview ?? imageUrl(editing!.image_path)!}
                        alt="Cottage photo preview"
                        className="h-[165px] w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="py-8 text-center">
                        <svg
                          width="42"
                          height="42"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#aebbb2"
                          strokeWidth="1.4"
                          className="mx-auto"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                        <p className="mt-3 text-xs font-medium text-[#849089]">No image uploaded yet</p>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-[10px] text-[#849089]">Recommended: High-quality cottage photo</p>
                </div>
              </div>
            </div>

            {formError && <p className="mt-4 text-[12px] font-semibold text-[#ae673c]">{formError}</p>}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={closeForm} className="min-h-11 flex-1 rounded-[3px] border border-[#d7ddd8] bg-white text-[13px] font-bold text-[#466158]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-[3px] bg-green text-[13px] font-bold text-white hover:brightness-105 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save cottage'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}