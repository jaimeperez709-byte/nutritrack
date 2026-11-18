import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal, NumField, Select, MacroLine } from './ui'
import { MEALS, num, entryTotals } from '../lib/nutrition'

// Hoja reutilizable: elegir cantidad (g o porciones) + comida, con vista previa de macros.
export default function QuantitySheet({ title, subtitle, base, unit, initialQty, initialMeal, onSave, onDelete, onClose, saveLabel = 'Guardar' }) {
  const [qty, setQty] = useState(String(initialQty ?? (unit === 'g' ? 100 : 1)))
  const [meal, setMeal] = useState(initialMeal)
  const q = num(qty)
  const t = entryTotals({ unit, qty: q, base })

  return (
    <Modal title={title} onClose={onClose}>
      {subtitle && <p className="-mt-1 mb-3 text-sm text-slate-500">{subtitle}</p>}
      <div className="grid grid-cols-2 gap-3">
        <NumField label={unit === 'g' ? 'Cantidad consumida' : 'Porciones'} value={qty} onChange={setQty} suffix={unit === 'g' ? 'g' : 'porc.'} />
        <Select label="Comida" value={meal} onChange={setMeal} options={MEALS.map((m) => [m.id, m.label])} />
      </div>

      <div className="card mt-4 text-center">
        <div className="text-4xl font-extrabold">{Math.round(t.kcal)}<span className="ml-1 text-base font-medium text-slate-400">kcal</span></div>
        <div className="mt-2 flex justify-center gap-4 text-sm">
          <span>P <b>{t.p.toFixed(1)}</b> g</span>
          <span>C <b>{t.c.toFixed(1)}</b> g</span>
          <span>G <b>{t.f.toFixed(1)}</b> g</span>
        </div>
        {unit === 'g' && (
          <MacroLine className="mt-2 block" t={base} />
        )}
        {unit === 'g' && <div className="text-[11px] text-slate-400">valores por 100 g</div>}
      </div>

      <div className="mt-4 flex gap-2">
        {onDelete && (
          <button className="btn-danger" onClick={onDelete} aria-label="Eliminar">
            <Trash2 size={18} />
          </button>
        )}
        <button className="btn-primary flex-1" disabled={q <= 0} onClick={() => onSave({ qty: q, meal })}>
          {saveLabel}
        </button>
      </div>
    </Modal>
  )
}
