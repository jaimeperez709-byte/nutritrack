import React, { useRef, useState } from 'react'
import { Calculator, Download, Upload, KeyRound, Smartphone, Trash2 } from 'lucide-react'
import { NumField, Select } from './ui'
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, calcGoals, num } from '../lib/nutrition'
import { exportBackup, readBackup } from '../lib/storage'
import { DEFAULT_MODELS } from '../lib/ai'

export default function Profile({ data, setData, replaceAll }) {
  const { profile } = data
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [showKey, setShowKey] = useState(false)

  const setP = (patch) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }))
  const calculable = num(profile.age) && num(profile.weight) && num(profile.height)

  const calculate = () => {
    const g = calcGoals(profile)
    if (!g) return
    setP({ calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat, onboarded: true })
    setMsg(`Metas calculadas (gasto estimado ${g.tdee} kcal/día). Puedes ajustarlas abajo.`)
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const next = await readBackup(file, data)
      if (window.confirm('Esto reemplazará tus datos actuales con los del respaldo. ¿Continuar?')) {
        replaceAll(next)
        setMsg('Respaldo importado correctamente.')
      }
    } catch (err) {
      setMsg(`No se pudo importar: ${err.message}`)
    }
  }

  const wipe = () => {
    if (window.confirm('¿Borrar TODOS los datos de la app en este dispositivo? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('nutritrack:v1')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-extrabold">Perfil y metas</h1>
      {!profile.onboarded && (
        <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700 dark:bg-emerald-950 dark:text-emerald-200">
          👋 ¡Bienvenido! Completa tus datos y toca “Calcular metas” para configurar tus calorías y macros.
        </p>
      )}

      <section className="card space-y-3">
        <h2 className="flex items-center gap-2 font-bold"><Calculator size={18} /> Calculadora de metas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Sexo" value={profile.sex} onChange={(v) => setP({ sex: v })} options={[['m', 'Hombre'], ['f', 'Mujer']]} />
          <NumField label="Edad" value={profile.age} onChange={(v) => setP({ age: v })} suffix="años" />
          <NumField label="Peso" value={profile.weight} onChange={(v) => setP({ weight: v })} suffix="kg" />
          <NumField label="Altura" value={profile.height} onChange={(v) => setP({ height: v })} suffix="cm" />
        </div>
        <Select label="Actividad" value={profile.activity} onChange={(v) => setP({ activity: v })} options={ACTIVITY_OPTIONS} />
        <Select label="Objetivo" value={profile.goal} onChange={(v) => setP({ goal: v })} options={GOAL_OPTIONS} />
        <button className="btn-primary w-full" disabled={!calculable} onClick={calculate}>Calcular metas</button>
        {msg && <p className="text-sm text-slate-500">{msg}</p>}
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">Metas diarias</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Calorías" value={profile.calories} onChange={(v) => setP({ calories: num(v), onboarded: true })} suffix="kcal" />
          <NumField label="Proteína" value={profile.protein} onChange={(v) => setP({ protein: num(v) })} suffix="g" />
          <NumField label="Carbohidratos" value={profile.carbs} onChange={(v) => setP({ carbs: num(v) })} suffix="g" />
          <NumField label="Grasas" value={profile.fat} onChange={(v) => setP({ fat: num(v) })} suffix="g" />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="flex items-center gap-2 font-bold"><KeyRound size={18} /> IA con tu propia API Key (opcional)</h2>
        <p className="text-xs text-slate-500">La clave se guarda solo en este dispositivo (localStorage) y se envía únicamente al proveedor elegido. Nunca se incluye en los respaldos.</p>
        <Select
          label="Proveedor"
          value={profile.aiProvider}
          onChange={(v) => setP({ aiProvider: v, aiModel: '' })}
          options={[['gemini', 'Google Gemini'], ['anthropic', 'Anthropic (Claude)']]}
        />
        <label className="block">
          <span className="label">API Key</span>
          <input
            className="input"
            type={showKey ? 'text' : 'password'}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={profile.aiKey}
            onChange={(e) => setP({ aiKey: e.target.value.trim() })}
            placeholder="Pega aquí tu clave"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={showKey} onChange={(e) => setShowKey(e.target.checked)} /> Mostrar clave
        </label>
        <label className="block">
          <span className="label">Modelo (opcional)</span>
          <input className="input" value={profile.aiModel} onChange={(e) => setP({ aiModel: e.target.value.trim() })} placeholder={DEFAULT_MODELS[profile.aiProvider]} autoCapitalize="off" />
        </label>
        <p className="text-xs text-slate-500">{profile.aiKey ? '✅ El botón “Analizar con IA” está activo en Hoy.' : 'Sin clave: la función de IA permanece oculta.'}</p>
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">Respaldo de datos</h2>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => exportBackup(data)}><Download size={18} /> Exportar</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={18} /> Importar</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        <button className="btn-danger w-full" onClick={wipe}><Trash2 size={16} /> Borrar todos los datos</button>
      </section>

      <section className="card text-sm text-slate-500">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100"><Smartphone size={18} /> Instalar la app</h2>
        <p><b>iPhone (Safari):</b> botón Compartir → “Añadir a pantalla de inicio”.</p>
        <p><b>Android (Chrome):</b> menú ⋮ → “Instalar app” / “Añadir a pantalla de inicio”.</p>
      </section>
    </div>
  )
}
