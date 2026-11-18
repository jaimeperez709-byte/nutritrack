import React, { useRef, useState } from 'react'
import { Camera, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { Modal, NumField, Select, TextField } from './ui'
import { analyzeMeal, fileToJpegBase64 } from '../lib/ai'
import { MEALS, defaultMeal, num, uid } from '../lib/nutrition'

export default function AIModal({ profile, onSave, onClose }) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null) // { b64, url }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState(null)
  const [meal, setMeal] = useState(defaultMeal())
  const fileRef = useRef(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const b64 = await fileToJpegBase64(file)
      setImage({ b64, url: `data:image/jpeg;base64,${b64}` })
    } catch (err) {
      setError(err.message)
    }
    e.target.value = ''
  }

  const run = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await analyzeMeal({
        provider: profile.aiProvider,
        apiKey: profile.aiKey,
        model: profile.aiModel,
        text,
        imageBase64: image?.b64,
      })
      if (!res.length) throw new Error('La IA no identificó alimentos. Intenta describir mejor el plato.')
      setItems(res.map((i) => ({ key: uid(), name: i.name, grams: String(i.grams), kcal: String(Math.round(i.kcal)), p: String(i.p), c: String(i.c), f: String(i.f) })))
    } catch (err) {
      setError(err.message || 'Error al analizar')
    }
    setLoading(false)
  }

  const upd = (key, field) => (v) => setItems((l) => l.map((i) => (i.key === key ? { ...i, [field]: v } : i)))

  const save = () => {
    const entries = items
      .filter((i) => i.name.trim() && num(i.kcal) >= 0)
      .map((i) => {
        const g = num(i.grams)
        const t = { kcal: num(i.kcal), p: num(i.p), c: num(i.c), f: num(i.f) }
        // Con gramos: se guarda por 100 g para poder editar la cantidad después
        return g > 0
          ? { id: uid(), meal, name: i.name.trim(), qty: g, unit: 'g', base: { kcal: (t.kcal / g) * 100, p: (t.p / g) * 100, c: (t.c / g) * 100, f: (t.f / g) * 100 } }
          : { id: uid(), meal, name: i.name.trim(), qty: 1, unit: 'porción', base: t }
      })
    onSave(entries)
  }

  return (
    <Modal title="Analizar con IA" onClose={onClose}>
      {!items ? (
        <div className="space-y-3">
          <label className="block">
            <span className="label">Describe lo que comiste</span>
            <textarea
              className="input min-h-24"
              placeholder="1 taza de lentejas guisadas con medio aguacate y 2 cucharadas de arroz"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
          {image ? (
            <div className="relative">
              <img src={image.url} alt="Plato" className="max-h-56 w-full rounded-xl object-cover" />
              <button className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white" onClick={() => setImage(null)} aria-label="Quitar foto">
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
              <Camera size={18} /> Tomar foto del plato
            </button>
          )}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
          <button className="btn-primary w-full" disabled={loading || (!text.trim() && !image)} onClick={run}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} {loading ? 'Analizando…' : 'Analizar'}
          </button>
          <p className="text-center text-[11px] text-slate-400">Las estimaciones de la IA son aproximadas: revísalas antes de guardar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Select label="Guardar en" value={meal} onChange={setMeal} options={MEALS.map((m) => [m.id, m.label])} />
          {items.map((i) => (
            <div key={i.key} className="card space-y-2">
              <div className="flex items-end gap-2">
                <TextField className="flex-1" label="Alimento" value={i.name} onChange={(e) => upd(i.key, 'name')(e.target.value)} />
                <button className="p-3 text-red-500" onClick={() => setItems((l) => l.filter((x) => x.key !== i.key))} aria-label="Quitar"><Trash2 size={18} /></button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <NumField label="g" value={i.grams} onChange={upd(i.key, 'grams')} />
                <NumField label="kcal" value={i.kcal} onChange={upd(i.key, 'kcal')} />
                <NumField label="P" value={i.p} onChange={upd(i.key, 'p')} />
                <NumField label="C" value={i.c} onChange={upd(i.key, 'c')} />
                <NumField label="G" value={i.f} onChange={upd(i.key, 'f')} />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => setItems(null)}>Volver</button>
            <button className="btn-primary" disabled={!items.length} onClick={save}>Guardar en el diario</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
