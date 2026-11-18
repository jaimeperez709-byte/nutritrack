import { seedFoods } from './seedFoods'

const KEY = 'nutritrack:v1'

export const emptyProfile = {
  sex: 'm',
  age: '',
  weight: '',
  height: '',
  activity: 'moderado',
  goal: 'mantenimiento',
  calories: 2000,
  protein: 120,
  carbs: 220,
  fat: 65,
  onboarded: false,
  aiProvider: 'gemini', // 'gemini' | 'anthropic'
  aiKey: '',
  aiModel: '',
}

const fresh = () => ({ profile: { ...emptyProfile }, foods: seedFoods(), recipes: [], log: {} })

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const d = JSON.parse(raw)
    return {
      profile: { ...emptyProfile, ...(d.profile || {}) },
      foods: Array.isArray(d.foods) ? d.foods : seedFoods(),
      recipes: Array.isArray(d.recipes) ? d.recipes : [],
      log: d.log && typeof d.log === 'object' ? d.log : {},
    }
  } catch {
    return fresh()
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('No se pudo guardar en localStorage', e)
  }
}

export function exportBackup(data) {
  // La API Key nunca se incluye en el respaldo
  const safe = { ...data, profile: { ...data.profile, aiKey: '' } }
  const payload = { app: 'nutritrack', version: 1, exportedAt: new Date().toISOString(), data: safe }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nutritrack-respaldo-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function readBackup(file, current) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const d = parsed.data || parsed
  if (!d || typeof d !== 'object' || !d.log || !Array.isArray(d.foods)) {
    throw new Error('El archivo no parece un respaldo de NutriTrack')
  }
  return {
    profile: { ...emptyProfile, ...(d.profile || {}), aiKey: current.profile.aiKey, aiProvider: current.profile.aiProvider, aiModel: current.profile.aiModel },
    foods: d.foods,
    recipes: Array.isArray(d.recipes) ? d.recipes : [],
    log: d.log,
  }
}
