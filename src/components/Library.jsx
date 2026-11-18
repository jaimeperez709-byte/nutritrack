import React, { useState } from 'react'
import { Plus, Share2, Pencil, Trash2, UtensilsCrossed, Search } from 'lucide-react'
import { MacroLine, Empty } from './ui'
import FoodForm from './FoodForm'
import RecipeEditor from './RecipeEditor'
import QuantitySheet from './QuantitySheet'
import { perPortion, defaultMeal, uid } from '../lib/nutrition'
import { shareRecipeWhatsApp } from '../lib/share'

export default function Library({ data, setData, addEntry, date }) {
  const [tab, setTab] = useState('recipes')
  const [q, setQ] = useState('')
  const [foodForm, setFoodForm] = useState(null) // {} nuevo | alimento
  const [recipeForm, setRecipeForm] = useState(null)
  const [logging, setLogging] = useState(null)
  const { foods, recipes } = data

  const upsert = (key, item) =>
    setData((d) => {
      const exists = d[key].some((x) => x.id === item.id)
      return { ...d, [key]: exists ? d[key].map((x) => (x.id === item.id ? item : x)) : [item, ...d[key]] }
    })
  const remove = (key, id, label) => {
    if (window.confirm(`¿Eliminar ${label}?`)) setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }))
  }

  const term = q.trim().toLowerCase()
  const shownFoods = foods.filter((f) => `${f.name} ${f.brand || ''}`.toLowerCase().includes(term)).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-extrabold">Recetas y alimentos</h1>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1 text-sm font-semibold dark:bg-slate-800">
        {[['recipes', `Mis recetas (${recipes.length})`], ['foods', `Alimentos (${foods.length})`]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-lg py-2 ${tab === id ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'recipes' ? (
        <>
          <button className="btn-primary w-full" onClick={() => setRecipeForm({})}>
            <Plus size={18} /> Nueva receta / lote
          </button>
          {recipes.length === 0 && <Empty>Combina ingredientes, define las porciones del lote y regístralas con un toque.</Empty>}
          {recipes.map((r) => {
            const pp = perPortion(r)
            return (
              <div key={r.id} className="card space-y-3">
                <div>
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="text-xs text-slate-500">{r.ingredients.length} ingredientes · {r.portions} porciones</p>
                  <MacroLine t={pp} /> <span className="text-xs text-slate-400">/ porción</span>
                </div>
                <button className="btn-primary w-full" onClick={() => setLogging(r)}>
                  <UtensilsCrossed size={18} /> Registrar porción
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button className="btn-ghost !px-2 text-sm" onClick={() => shareRecipeWhatsApp(r)}>
                    <Share2 size={16} /> WhatsApp
                  </button>
                  <button className="btn-ghost !px-2 text-sm" onClick={() => setRecipeForm(r)}>
                    <Pencil size={16} /> Editar
                  </button>
                  <button className="btn-danger !px-2 text-sm" onClick={() => remove('recipes', r.id, `la receta “${r.name}”`)}>
                    <Trash2 size={16} /> Borrar
                  </button>
                </div>
              </div>
            )
          })}
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Buscar alimento…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn-primary !px-3" onClick={() => setFoodForm({})} aria-label="Nuevo alimento">
              <Plus size={20} />
            </button>
          </div>
          <ul className="card divide-y divide-slate-100 !p-0 dark:divide-slate-800">
            {shownFoods.map((f) => (
              <li key={f.id} className="flex items-center gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{f.name}{f.brand ? <span className="text-slate-400"> · {f.brand}</span> : null}</div>
                  <MacroLine t={f} /> <span className="text-xs text-slate-400">/ 100 g</span>
                </div>
                <button className="p-2 text-slate-500" onClick={() => setFoodForm(f)} aria-label="Editar"><Pencil size={18} /></button>
                <button className="p-2 text-red-500" onClick={() => remove('foods', f.id, `“${f.name}”`)} aria-label="Eliminar"><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
          {shownFoods.length === 0 && <Empty>Sin resultados</Empty>}
        </>
      )}

      {foodForm && (
        <FoodForm
          title={foodForm.id ? 'Editar alimento' : 'Nuevo alimento'}
          initial={foodForm.id ? foodForm : null}
          onClose={() => setFoodForm(null)}
          onSave={(f) => {
            upsert('foods', f)
            setFoodForm(null)
          }}
        />
      )}
      {recipeForm && (
        <RecipeEditor
          initial={recipeForm.id ? recipeForm : null}
          foods={foods}
          onClose={() => setRecipeForm(null)}
          onSave={(r) => {
            upsert('recipes', r)
            setRecipeForm(null)
          }}
        />
      )}
      {logging && (
        <QuantitySheet
          title={logging.name}
          subtitle="Registrar en el diario"
          base={perPortion(logging)}
          unit="porción"
          initialQty={1}
          initialMeal={defaultMeal()}
          onClose={() => setLogging(null)}
          onSave={({ qty, meal }) => {
            addEntry(date, { id: uid(), meal, name: logging.name, qty, unit: 'porción', base: perPortion(logging) })
            setLogging(null)
          }}
        />
      )}
    </div>
  )
}
