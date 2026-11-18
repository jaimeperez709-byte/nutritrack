import React, { useState } from 'react'
import { Modal, NumField, TextField } from './ui'
import { num, uid } from '../lib/nutrition'

// Crear/editar un alimento (valores por 100 g). También sirve de fallback del escáner.
export default function FoodForm({ initial, title = 'Alimento', note, onSave, onClose }) {
  const [f, setF] = useState({
    name: initial?.name ?? '',
    brand: initial?.brand ?? '',
    kcal: initial?.kcal ?? '',
    p: initial?.p ?? '',
    c: initial?.c ?? '',
    f: initial?.f ?? '',
  })
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: typeof v === 'string' ? v : v.target.value }))
  const ok = f.name.trim() && f.kcal !== ''

  const submit = () =>
    onSave({
      ...(initial || {}),
      id: initial?.id || uid(),
      name: f.name.trim(),
      brand: f.brand.trim(),
      kcal: num(f.kcal),
      p: num(f.p),
      c: num(f.c),
      f: num(f.f),
    })

  return (
    <Modal title={title} onClose={onClose}>
      {note && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">{note}</p>}
      <div className="space-y-3">
        <TextField label="Nombre" value={f.name} onChange={set('name')} placeholder="Ej. Tofu firme" />
        <TextField label="Marca (opcional)" value={f.brand} onChange={set('brand')} />
        <p className="label !mb-0 pt-1">Valores por 100 g</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Calorías" value={f.kcal} onChange={set('kcal')} suffix="kcal" />
          <NumField label="Proteína" value={f.p} onChange={set('p')} suffix="g" />
          <NumField label="Carbohidratos" value={f.c} onChange={set('c')} suffix="g" />
          <NumField label="Grasas" value={f.f} onChange={set('f')} suffix="g" />
        </div>
      </div>
      <button className="btn-primary mt-5 w-full" disabled={!ok} onClick={submit}>
        Guardar alimento
      </button>
    </Modal>
  )
}
