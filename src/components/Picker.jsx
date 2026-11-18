import React, { useMemo, useState } from 'react'
import { Search, Camera } from 'lucide-react'
import { Modal, Empty, MacroLine } from './ui'
import { perPortion } from '../lib/nutrition'

// Buscador de alimentos y/o recetas. onPick({kind:'food'|'recipe', item})
export default function Picker({ foods, recipes = [], allowRecipes = true, onPick, onClose, onScan, title = 'Añadir alimento' }) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('foods')
  const term = q.trim().toLowerCase()

  const fl = useMemo(
    () => foods.filter((f) => `${f.name} ${f.brand || ''}`.toLowerCase().includes(term)).sort((a, b) => a.name.localeCompare(b.name)),
    [foods, term]
  )
  const rl = useMemo(() => recipes.filter((r) => r.name.toLowerCase().includes(term)), [recipes, term])

  return (
    <Modal title={title} onClose={onClose}>
      {onScan && (
        <button className="btn-primary mb-3 w-full !py-3" onClick={onScan}>
          <Camera size={18} /> Escanear: foto o código de barras
        </button>
      )}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {allowRecipes && (
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1 text-sm font-semibold dark:bg-slate-800">
          {[['foods', 'Alimentos'], ['recipes', 'Mis recetas']].map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-lg py-1.5 ${tab === id ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}>
              {l}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
        {tab === 'foods' &&
          fl.map((f) => (
            <li key={f.id}>
              <button className="w-full py-3 text-left" onClick={() => onPick({ kind: 'food', item: f })}>
                <div className="font-medium">{f.name}{f.brand ? <span className="text-slate-400"> · {f.brand}</span> : null}</div>
                <MacroLine t={f} />
              </button>
            </li>
          ))}
        {tab === 'recipes' &&
          rl.map((r) => (
            <li key={r.id}>
              <button className="w-full py-3 text-left" onClick={() => onPick({ kind: 'recipe', item: r })}>
                <div className="font-medium">{r.name}</div>
                <MacroLine t={perPortion(r)} /> <span className="text-xs text-slate-400">/ porción</span>
              </button>
            </li>
          ))}
      </ul>
      {tab === 'foods' && fl.length === 0 && <Empty>Sin resultados</Empty>}
      {tab === 'recipes' && rl.length === 0 && <Empty>Aún no tienes recetas</Empty>}
    </Modal>
  )
}
