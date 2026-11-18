import React from 'react'
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react'
import { Ring, MacroBar, MacroLine, Empty } from './ui'
import ProgressCard from './Progress'
import { MEALS, sumTotals, entryTotals, prettyDate, shiftDate, dateKey, r0 } from '../lib/nutrition'

export default function Dashboard({ data, setData, date, setDate, onAdd, onEdit, onAI, onGoProfile }) {
  const { profile, log } = data
  const entries = log[date] || []
  const total = sumTotals(entries)
  const today = dateKey()
  const hasAI = !!profile.aiKey

  return (
    <div className="space-y-4 p-4">
      {/* Selector de fecha */}
      <div className="flex items-center justify-between gap-2">
        <button className="btn-ghost !p-2.5" onClick={() => setDate(shiftDate(date, -1))} aria-label="Día anterior">
          <ChevronLeft size={20} />
        </button>
        <label className="relative flex-1 text-center">
          <span className="text-lg font-bold capitalize">{prettyDate(date)}</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="absolute inset-0 h-full w-full opacity-0"
            aria-label="Elegir fecha"
          />
        </label>
        <button className="btn-ghost !p-2.5" onClick={() => setDate(shiftDate(date, 1))} aria-label="Día siguiente">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex justify-center gap-2 text-xs font-semibold">
        <button className={`rounded-full px-3 py-1 ${date === today ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`} onClick={() => setDate(today)}>Hoy</button>
        <button className={`rounded-full px-3 py-1 ${date === shiftDate(today, -1) ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`} onClick={() => setDate(shiftDate(today, -1))}>Ayer</button>
      </div>

      <ProgressCard data={data} setData={setData} onGoProfile={onGoProfile} />

      {/* Resumen */}
      <div className="card flex items-center gap-4">
        <Ring value={total.kcal} goal={profile.calories} />
        <div className="flex-1 space-y-3">
          <MacroBar label="Proteína" value={total.p} goal={profile.protein} color="bg-sky-500" />
          <MacroBar label="Carbohidratos" value={total.c} goal={profile.carbs} color="bg-amber-500" />
          <MacroBar label="Grasas" value={total.f} goal={profile.fat} color="bg-rose-500" />
          <p className="text-xs text-slate-500">
            {total.kcal <= profile.calories ? `Te quedan ${r0(profile.calories - total.kcal)} kcal` : `Excedido por ${r0(total.kcal - profile.calories)} kcal`}
          </p>
        </div>
      </div>

      <button className="btn-primary w-full !py-3.5" onClick={onAI}>
        <Sparkles size={18} /> {hasAI ? 'Foto de tu comida con IA' : 'Activar foto de comida con IA'}
      </button>
      {!hasAI && (
        <p className="-mt-2 text-center text-xs text-slate-500">Necesitas pegar una clave gratuita en Perfil (toma 2 minutos).</p>
      )}

      {/* Comidas */}
      {MEALS.map((m) => {
        const list = entries.filter((e) => e.meal === m.id)
        const t = sumTotals(list)
        return (
          <section key={m.id} className="card !p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <h3 className="font-bold">{m.label}</h3>
                <span className="text-xs text-slate-500">{r0(t.kcal)} kcal</span>
              </div>
              <button className="rounded-full bg-brand-600 p-2 text-white" onClick={() => onAdd(m.id)} aria-label={`Añadir a ${m.label}`}>
                <Plus size={18} />
              </button>
            </div>
            {list.length === 0 ? (
              <p className="px-4 pb-3 text-sm text-slate-400">Sin registros</p>
            ) : (
              <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {list.map((e) => (
                  <li key={e.id}>
                    <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => onEdit(e)}>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.name}</div>
                        <div className="text-xs text-slate-500">
                          {e.unit === 'g' ? `${r0(e.qty * 10) / 10} g` : `${e.qty} porc.`}
                        </div>
                      </div>
                      <MacroLine t={entryTotals(e)} className="shrink-0 text-right" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
      {entries.length === 0 && <Empty>Toca “+” en una comida o ve a “Escanear” para empezar.</Empty>}
    </div>
  )
}
