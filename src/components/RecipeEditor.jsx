import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, NumField, TextField, MacroLine } from './ui'
import Picker from './Picker'
import { num, uid, perPortion, recipeTotals } from '../lib/nutrition'

export default function RecipeEditor({ initial, foods, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [portions, setPortions] = useState(String(initial?.portions || 4))
  const [rows, setRows] = useState(
    (initial?.ingredients || []).map((i) => ({ key: uid(), name: i.name, grams: String(i.grams), per100: i.per100 }))
  )
  const [picking, setPicking] = useState(false)

  const current = {
    ingredients: rows.map((r) => ({ name: r.name, grams: num(r.grams), per100: r.per100 })),
    portions: num(portions) || 1,
  }
  const total = recipeTotals(current)
  const pp = perPortion(current)
  const ok = name.trim() && rows.length > 0 && num(portions) > 0

  const setGrams = (key, v) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, grams: v } : r)))

  return (
    <Modal title={initial ? 'Editar receta' : 'Nueva receta / lote'} onClose={onClose}>
      <div className="space-y-3">
        <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Soya texturizada teriyaki" />
        <NumField label="Porciones totales del lote" value={portions} onChange={setPortions} suffix="porc." />

        <div>
          <p className="label">Ingredientes (peso exacto en gramos)</p>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.name}</span>
                <div className="w-28">
                  <NumField value={r.grams} onChange={(v) => setGrams(r.key, v)} suffix="g" />
                </div>
                <button className="p-2 text-red-500" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label="Quitar">
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
          <button className="btn-ghost mt-2 w-full" onClick={() => setPicking(true)}>
            <Plus size={18} /> Agregar ingrediente
          </button>
        </div>

        <div className="card text-center">
          <div className="text-xs text-slate-500">Por porción</div>
          <div className="text-3xl font-extrabold">{Math.round(pp.kcal)} <span className="text-base font-medium text-slate-400">kcal</span></div>
          <MacroLine t={pp} />
          <div className="mt-1 text-[11px] text-slate-400">Lote completo: {Math.round(total.kcal)} kcal</div>
        </div>

        <button
          className="btn-primary w-full"
          disabled={!ok}
          onClick={() =>
            onSave({
              id: initial?.id || uid(),
              name: name.trim(),
              portions: num(portions),
              ingredients: current.ingredients.filter((i) => i.grams > 0),
            })
          }
        >
          Guardar receta
        </button>
      </div>

      {picking && (
        <Picker
          foods={foods}
          allowRecipes={false}
          title="Elegir ingrediente"
          onClose={() => setPicking(false)}
          onPick={({ item }) => {
            setRows((rs) => [...rs, { key: uid(), name: item.name, grams: '100', per100: { kcal: item.kcal, p: item.p, c: item.c, f: item.f } }])
            setPicking(false)
          }}
        />
      )}
    </Modal>
  )
}
