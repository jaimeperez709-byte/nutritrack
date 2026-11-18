export const MEALS = [
  { id: 'desayuno', label: 'Desayuno' },
  { id: 'almuerzo', label: 'Almuerzo' },
  { id: 'cena', label: 'Cena' },
  { id: 'snacks', label: 'Snacks' },
]

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// Acepta coma o punto decimal ("85,5" → 85.5)
export const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const r1 = (n) => Math.round(n * 10) / 10
export const r0 = (n) => Math.round(n)

export const dateKey = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const shiftDate = (key, days) => {
  const d = parseKey(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}

export const prettyDate = (key) => {
  const today = dateKey()
  if (key === today) return 'Hoy'
  if (key === shiftDate(today, -1)) return 'Ayer'
  if (key === shiftDate(today, 1)) return 'Mañana'
  return parseKey(key).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const defaultMeal = () => {
  const h = new Date().getHours()
  if (h < 11) return 'desayuno'
  if (h < 16) return 'almuerzo'
  if (h < 21) return 'cena'
  return 'snacks'
}

// Un registro guarda: qty + unit ('g' | 'porción') + base (por 100 g, o por porción)
export const factor = (e) => (e.unit === 'g' ? e.qty / 100 : e.qty)

export const entryTotals = (e) => {
  const f = factor(e)
  return { kcal: e.base.kcal * f, p: e.base.p * f, c: e.base.c * f, f: e.base.f * f }
}

export const sumTotals = (list) =>
  list.reduce(
    (a, e) => {
      const t = entryTotals(e)
      return { kcal: a.kcal + t.kcal, p: a.p + t.p, c: a.c + t.c, f: a.f + t.f }
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  )

// Ingredientes de receta: { name, grams, per100: {kcal,p,c,f} }
export const recipeTotals = (rec) =>
  rec.ingredients.reduce(
    (a, i) => {
      const k = i.grams / 100
      return {
        kcal: a.kcal + i.per100.kcal * k,
        p: a.p + i.per100.p * k,
        c: a.c + i.per100.c * k,
        f: a.f + i.per100.f * k,
      }
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  )

export const perPortion = (rec) => {
  const t = recipeTotals(rec)
  const n = rec.portions > 0 ? rec.portions : 1
  return { kcal: t.kcal / n, p: t.p / n, c: t.c / n, f: t.f / n }
}

const ACTIVITY = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muy_alto: 1.9,
}
export const ACTIVITY_OPTIONS = [
  ['sedentario', 'Sedentario (poco o nada de ejercicio)'],
  ['ligero', 'Ligero (1-3 días/semana)'],
  ['moderado', 'Moderado (3-5 días/semana)'],
  ['alto', 'Alto (6-7 días/semana)'],
  ['muy_alto', 'Muy alto (trabajo físico + entreno)'],
]
export const GOAL_OPTIONS = [
  ['deficit', 'Déficit (bajar de peso)'],
  ['mantenimiento', 'Mantenimiento'],
  ['superavit', 'Superávit (ganar masa)'],
]

// Mifflin-St Jeor + reparto de macros
export function calcGoals({ sex, age, weight, height, activity, goal }) {
  const w = num(weight), h = num(height), a = num(age)
  if (!w || !h || !a) return null
  const bmr = 10 * w + 6.25 * h - 5 * a + (sex === 'f' ? -161 : 5)
  const tdee = bmr * (ACTIVITY[activity] || 1.55)
  const adj = goal === 'deficit' ? -500 : goal === 'superavit' ? 300 : 0
  const calories = Math.max(1200, r0(tdee + adj))
  const protein = r0(w * (goal === 'deficit' ? 2.0 : 1.8))
  const fat = r0((calories * 0.25) / 9)
  const carbs = Math.max(0, r0((calories - protein * 4 - fat * 9) / 4))
  return { calories, protein, carbs, fat, tdee: r0(tdee) }
}
