import React, { useRef, useState } from 'react'
import { Calculator, Download, Upload, KeyRound, Smartphone, Trash2, Cloud, Copy } from 'lucide-react'
import { NumField, Select, TextField } from './ui'
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, planGoals, goalOfPlan, num, r1, longDate, dateKey } from '../lib/nutrition'
import { exportBackup, readBackup, clearCurrent } from '../lib/storage'
import { getCode, setCode, newCode, prettyCode, normalizeCode, push, pull, mergeRemote } from '../lib/sync'
import { DEFAULT_MODELS } from '../lib/ai'

export default function Profile({ data, setData, replaceAll, userId }) {
  const { profile } = data
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [showKey, setShowKey] = useState(false)

  const setP = (patch) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }))
  const calculable = num(profile.age) && num(profile.weight) && num(profile.height)

  const calculate = () => {
    const g = planGoals(profile)
    if (!g) return
    const kg = num(profile.weight)
    setData((d) => ({
      ...d,
      // el primer peso queda como punto de partida del historial
      weights: d.weights?.length ? d.weights : [{ d: dateKey(), kg }],
      profile: { ...d.profile, calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat, goal: goalOfPlan(g), onboarded: true },
    }))
    const ritmo = `${g.weeklyKg < 0 ? 'bajar' : g.weeklyKg > 0 ? 'subir' : 'mantener'} ~${r1(Math.abs(g.weeklyKg))} kg/semana`
    setMsg(
      g.mode === 'manual'
        ? `Metas calculadas (gasto estimado ${g.tdee} kcal/día). Ajústalas abajo si quieres.`
        : `Para llegar a ${profile.goalWeight} kg ${g.mode === 'evento' ? `el ${longDate(profile.eventDate)} (${g.days} días)` : ''}: ${ritmo} → ${g.calories} kcal/día (gasto estimado ${g.tdee}).` +
            (g.capped ? ' Ojo: la fecha es muy exigente; limité el ritmo a lo seguro, así que quizá llegues un poco después.' : '') +
            (g.floored ? ' Subí las calorías al mínimo saludable.' : '')
    )
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
      clearCurrent()
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
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Peso objetivo" value={profile.goalWeight} onChange={(v) => setP({ goalWeight: v })} suffix="kg" />
          <TextField label="Nombre de la meta" value={profile.eventName} onChange={(e) => setP({ eventName: e.target.value })} placeholder="Boda" />
        </div>
        <label className="block">
          <span className="label">Fecha de la meta</span>
          <input type="date" className="input" value={profile.eventDate} onChange={(e) => setP({ eventDate: e.target.value })} />
        </label>
        <Select label="Actividad" value={profile.activity} onChange={(v) => setP({ activity: v })} options={ACTIVITY_OPTIONS} />
        {!num(profile.goalWeight) && <Select label="Objetivo" value={profile.goal} onChange={(v) => setP({ goal: v })} options={GOAL_OPTIONS} />}
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
        <p className="text-xs text-slate-500">
          Con una clave puedes tomar una foto de tu plato y la IA calcula calorías y macros. Clave gratis de Gemini: abre <b>aistudio.google.com/apikey</b>, pulsa “Create API key” y pégala aquí. Se guarda solo en este teléfono y nunca va en los respaldos.
        </p>
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

      <CloudSection userId={userId} data={data} replaceAll={replaceAll} />

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

function CloudSection({ userId, data, replaceAll }) {
  const [code, setC] = useState(() => getCode(userId))
  const [entry, setEntry] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const activate = async () => {
    setBusy(true)
    try {
      const c = newCode()
      await push(c, data)
      setCode(userId, c)
      setC(normalizeCode(c))
      setMsg('Listo: tus datos ya se guardan en la nube. Anota este código en un lugar seguro.')
    } catch {
      setMsg('No se pudo conectar. Revisa tu internet e intenta de nuevo.')
    }
    setBusy(false)
  }
  const restore = async () => {
    const c = normalizeCode(entry)
    if (c.length < 20) return setMsg('El código tiene 20 letras y números. Revisa que esté completo.')
    setBusy(true)
    try {
      const remote = await pull(c)
      if (!remote?.data) setMsg('No encontré datos con ese código.')
      else if (window.confirm('Esto reemplaza los datos de este teléfono por los de la nube. ¿Continuar?')) {
        setCode(userId, c)
        setC(c)
        replaceAll(mergeRemote(remote.data, data))
        setMsg('Datos recuperados desde la nube.')
      }
    } catch {
      setMsg('No se pudo conectar. Revisa tu internet e intenta de nuevo.')
    }
    setBusy(false)
  }
  const copy = () => navigator.clipboard?.writeText(prettyCode(code)).then(() => setMsg('Código copiado.'))

  return (
    <section className="card space-y-3">
      <h2 className="flex items-center gap-2 font-bold"><Cloud size={18} /> Guardado en la nube</h2>
      {code ? (
        <>
          <p className="text-xs text-slate-500">✅ Se guarda solo en la nube cada vez que cambias algo. Si borras el historial o cambias de teléfono, entra aquí con tu código para recuperar todo.</p>
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
            <code className="flex-1 break-all text-sm font-semibold tracking-wide">{prettyCode(code)}</code>
            <button className="btn-ghost !p-2" onClick={copy} aria-label="Copiar"><Copy size={16} /></button>
          </div>
          <p className="text-xs text-slate-500">Guarda este código (en notas o WhatsApp contigo mismo). Quien lo tenga puede ver tus datos, no lo compartas.</p>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500">Hoy tus datos viven solo en este teléfono: si limpias el historial del navegador se pierden. Actívalo para tener copia automática en la nube.</p>
          <button className="btn-primary w-full" disabled={busy} onClick={activate}>{busy ? 'Activando…' : 'Activar guardado en la nube'}</button>
        </>
      )}
      <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        <span className="label">¿Ya tienes un código? Recupera tus datos</span>
        <div className="flex gap-2">
          <input className="input" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autoCapitalize="characters" autoCorrect="off" spellCheck={false} />
          <button className="btn-ghost" disabled={busy || !entry} onClick={restore}>Recuperar</button>
        </div>
      </div>
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
    </section>
  )
}
