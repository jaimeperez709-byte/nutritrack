import React, { useState } from 'react'
import { Scale, CalendarHeart } from 'lucide-react'
import { Modal, NumField } from './ui'
import { dateKey, daysUntil, longDate, num, planGoals, goalOfPlan, r1, parseKey } from '../lib/nutrition'

const lastWeight = (data) => {
  const w = data.weights || []
  return w.length ? w[w.length - 1] : null
}

// Aplica un peso nuevo: lo guarda en el historial y recalcula las metas automáticamente
export function logWeight(setData, kg, day = dateKey()) {
  setData((d) => {
    const weights = [...(d.weights || []).filter((w) => w.d !== day), { d: day, kg }].sort((a, b) => (a.d < b.d ? -1 : 1))
    const profile = { ...d.profile, weight: String(kg) }
    const g = planGoals(profile)
    if (g) Object.assign(profile, { calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat, goal: goalOfPlan(g), onboarded: true })
    return { ...d, weights, profile }
  })
}

function Spark({ points }) {
  if (points.length < 2) return null
  const xs = points.map((p) => parseKey(p.d).getTime())
  const ys = points.map((p) => p.kg)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const y0 = Math.min(...ys), y1 = Math.max(...ys)
  const sx = (x) => 6 + ((x - x0) / (x1 - x0 || 1)) * 188
  const sy = (y) => 44 - ((y - y0) / (y1 - y0 || 1)) * 38
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(xs[i]).toFixed(1)},${sy(p.kg).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 200 50" className="h-12 w-full">
      <path d={d} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand-500" />
      <circle cx={sx(xs[xs.length - 1])} cy={sy(ys[ys.length - 1])} r="3.5" className="fill-brand-600" />
    </svg>
  )
}

export function WeightSheet({ data, setData, onClose }) {
  const last = lastWeight(data)
  const [kg, setKg] = useState(String(last?.kg ?? data.profile.weight ?? ''))
  const v = num(kg)
  const preview = v > 0 ? planGoals({ ...data.profile, weight: String(v) }) : null
  return (
    <Modal title="Registrar peso" onClose={onClose}>
      <NumField label="Peso de hoy" value={kg} onChange={setKg} suffix="kg" />
      {preview && (
        <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
          Con este peso tu meta diaria queda en <b>{preview.calories} kcal</b> · P {preview.protein} g · C {preview.carbs} g · G {preview.fat} g.
        </p>
      )}
      <button
        className="btn-primary mt-4 w-full"
        disabled={v < 20 || v > 400}
        onClick={() => {
          logWeight(setData, r1(v))
          onClose()
        }}
      >
        Guardar y recalcular
      </button>
    </Modal>
  )
}

export default function ProgressCard({ data, setData, onGoProfile }) {
  const [open, setOpen] = useState(false)
  const { profile } = data
  const last = lastWeight(data)
  const current = last ? last.kg : num(profile.weight)
  const goal = num(profile.goalWeight)
  const days = daysUntil(profile.eventDate)
  const name = profile.eventName || 'tu meta'

  if (!current || !goal) {
    return (
      <button className="card flex w-full items-center gap-3 text-left" onClick={onGoProfile}>
        <Scale className="text-brand-600" />
        <div>
          <div className="font-bold">Pon tu peso y tu objetivo</div>
          <div className="text-xs text-slate-500">La app calcula sola cuántas calorías comer hasta {name.toLowerCase()}.</div>
        </div>
      </button>
    )
  }

  const start = data.weights?.[0]?.kg ?? current
  const pct = start === goal ? 100 : Math.max(0, Math.min(100, ((start - current) / (start - goal)) * 100))
  const left = r1(Math.abs(current - goal))
  const daysSince = last ? -daysUntil(last.d) : 99
  const due = daysSince >= 7
  const plan = planGoals(profile)

  return (
    <>
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <CalendarHeart size={16} className="text-rose-500" />
              {days > 0 ? `Faltan ${days} días para ${name.toLowerCase()}` : name}
            </div>
            <div className="text-xs text-slate-500">{profile.eventDate && longDate(profile.eventDate)}</div>
          </div>
          <button className={`rounded-full px-3 py-1.5 text-xs font-semibold ${due ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`} onClick={() => setOpen(true)}>
            {due ? 'Pesarme hoy' : 'Registrar peso'}
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-extrabold leading-none">{r1(current)}<span className="ml-1 text-sm font-medium text-slate-400">kg</span></div>
            <div className="mt-1 text-xs text-slate-500">actual</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold leading-none">{r1(goal)}<span className="ml-1 text-sm font-medium text-slate-400">kg</span></div>
            <div className="mt-1 text-xs text-slate-500">objetivo · {left === 0 ? '¡meta lograda!' : `${current > goal ? 'faltan' : 'faltan'} ${left} kg`}</div>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <Spark points={(data.weights || []).slice(-12)} />

        {plan && plan.mode !== 'manual' && (
          <p className="text-xs text-slate-500">
            Ritmo del plan: {plan.weeklyKg < 0 ? 'bajar' : plan.weeklyKg > 0 ? 'subir' : 'mantener'} ~{r1(Math.abs(plan.weeklyKg))} kg/semana ·{' '}
            <b>{plan.calories} kcal/día</b>
            {plan.capped && ' · (limitado a un ritmo seguro: tu fecha es muy exigente)'}
          </p>
        )}
        {due && <p className="text-xs font-medium text-amber-600">Ya pasó una semana desde tu último peso. Pésate y regístralo para ajustar las calorías.</p>}
      </div>
      {open && <WeightSheet data={data} setData={setData} onClose={() => setOpen(false)} />}
    </>
  )
}
