import React, { useCallback, useEffect, useState } from 'react'
import { Home, ScanLine, BookOpen, User } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Scanner from './components/Scanner'
import Library from './components/Library'
import Profile from './components/Profile'
import Picker from './components/Picker'
import QuantitySheet from './components/QuantitySheet'
import AIModal from './components/AIModal'
import ImportRecipeModal from './components/ImportRecipeModal'
import { loadData, saveData } from './lib/storage'
import { dateKey, defaultMeal, perPortion, uid } from './lib/nutrition'
import { readImportParam, clearImportParam } from './lib/share'

const TABS = [
  { id: 'hoy', label: 'Hoy', Icon: Home },
  { id: 'escanear', label: 'Escanear', Icon: ScanLine },
  { id: 'recetas', label: 'Recetas', Icon: BookOpen },
  { id: 'perfil', label: 'Perfil', Icon: User },
]

export default function App() {
  const [data, setData] = useState(loadData)
  const [tab, setTab] = useState(() => (loadData().profile.onboarded ? 'hoy' : 'perfil'))
  const [date, setDate] = useState(dateKey())

  const [adding, setAdding] = useState(null) // { meal } → Picker
  const [picked, setPicked] = useState(null) // { kind, item, meal }
  const [editing, setEditing] = useState(null) // entry
  const [aiOpen, setAiOpen] = useState(false)
  const [incoming, setIncoming] = useState(null) // receta recibida por enlace

  useEffect(() => saveData(data), [data])

  // Enlace mágico: ?importRecipe=...
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('importRecipe')) {
      const r = readImportParam()
      if (r) setIncoming(r)
      else clearImportParam()
    }
  }, [])

  const replaceAll = useCallback((next) => setData(next), [])

  const addEntry = useCallback((day, entry) => {
    setData((d) => ({ ...d, log: { ...d.log, [day]: [...(d.log[day] || []), entry] } }))
  }, [])
  const addEntries = (day, entries) => entries.forEach((e) => addEntry(day, e))

  const addFood = useCallback((food) => {
    setData((d) => ({ ...d, foods: d.foods.some((f) => f.id === food.id) ? d.foods : [food, ...d.foods] }))
  }, [])

  const updateEntry = (id, patch) =>
    setData((d) => ({ ...d, log: { ...d.log, [date]: (d.log[date] || []).map((e) => (e.id === id ? { ...e, ...patch } : e)) } }))
  const deleteEntry = (id) =>
    setData((d) => ({ ...d, log: { ...d.log, [date]: (d.log[date] || []).filter((e) => e.id !== id) } }))

  const closeImport = () => {
    clearImportParam()
    setIncoming(null)
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col">
      <main className="safe-top flex-1 overflow-y-auto pb-24">
        {tab === 'hoy' && (
          <Dashboard
            data={data}
            date={date}
            setDate={setDate}
            onAdd={(meal) => setAdding({ meal })}
            onEdit={setEditing}
            onAI={() => setAiOpen(true)}
          />
        )}
        {tab === 'escanear' && <Scanner foods={data.foods} addFood={addFood} addEntry={addEntry} date={date} />}
        {tab === 'recetas' && <Library data={data} setData={setData} addEntry={addEntry} date={date} />}
        {tab === 'perfil' && <Profile data={data} setData={setData} replaceAll={replaceAll} />}
      </main>

      {/* Barra inferior fija */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${tab === id ? 'text-brand-600' : 'text-slate-400'}`}
            >
              <Icon size={24} strokeWidth={tab === id ? 2.5 : 2} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {adding && !picked && (
        <Picker foods={data.foods} recipes={data.recipes} onClose={() => setAdding(null)} onPick={(p) => setPicked({ ...p, meal: adding.meal })} />
      )}
      {picked && (
        <QuantitySheet
          title={picked.item.name}
          subtitle={picked.kind === 'recipe' ? 'Receta' : picked.item.brand}
          base={picked.kind === 'recipe' ? perPortion(picked.item) : { kcal: picked.item.kcal, p: picked.item.p, c: picked.item.c, f: picked.item.f }}
          unit={picked.kind === 'recipe' ? 'porción' : 'g'}
          initialQty={picked.kind === 'recipe' ? 1 : 100}
          initialMeal={picked.meal}
          onClose={() => setPicked(null)}
          onSave={({ qty, meal }) => {
            const it = picked.item
            addEntry(date, {
              id: uid(),
              meal,
              name: it.name,
              qty,
              unit: picked.kind === 'recipe' ? 'porción' : 'g',
              base: picked.kind === 'recipe' ? perPortion(it) : { kcal: it.kcal, p: it.p, c: it.c, f: it.f },
            })
            setPicked(null)
            setAdding(null)
          }}
        />
      )}
      {editing && (
        <QuantitySheet
          title={editing.name}
          subtitle="Editar registro"
          base={editing.base}
          unit={editing.unit}
          initialQty={editing.qty}
          initialMeal={editing.meal}
          onClose={() => setEditing(null)}
          onDelete={() => {
            deleteEntry(editing.id)
            setEditing(null)
          }}
          onSave={({ qty, meal }) => {
            updateEntry(editing.id, { qty, meal })
            setEditing(null)
          }}
        />
      )}
      {aiOpen && (
        <AIModal
          profile={data.profile}
          onClose={() => setAiOpen(false)}
          onSave={(entries) => {
            addEntries(date, entries)
            setAiOpen(false)
          }}
        />
      )}
      {incoming && (
        <ImportRecipeModal
          recipe={incoming}
          onClose={closeImport}
          onSave={() => {
            setData((d) => ({ ...d, recipes: [{ ...incoming, id: uid() }, ...d.recipes] }))
            setTab('recetas')
            closeImport()
          }}
        />
      )}
    </div>
  )
}
