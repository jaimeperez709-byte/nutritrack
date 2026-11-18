import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, CameraOff, Loader2, Keyboard, Sparkles } from 'lucide-react'
import QuantitySheet from './QuantitySheet'
import FoodForm from './FoodForm'
import { fetchProduct } from '../lib/openFoodFacts'
import { defaultMeal, uid } from '../lib/nutrition'

const READER_ID = 'reader'
const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
]

export default function Scanner({ foods, addFood, addEntry, date, onFoodPhoto, meal, onDone }) {
  const scannerRef = useRef(null)
  const busyRef = useRef(false)
  const [state, setState] = useState('idle') // idle | starting | scanning | loading
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const [product, setProduct] = useState(null) // listo para registrar
  const [missing, setMissing] = useState(null) // { barcode, partial }

  const stop = async () => {
    const s = scannerRef.current
    scannerRef.current = null
    if (s) {
      try { if (s.isScanning) await s.stop() } catch { /* noop */ }
      try { s.clear() } catch { /* noop */ }
    }
  }

  useEffect(() => () => { stop() }, [])

  const lookup = async (barcode) => {
    setState('loading')
    setError('')
    const local = foods.find((f) => f.barcode === barcode)
    if (local) {
      setProduct(local)
      setState('idle')
      return
    }
    try {
      const res = await fetchProduct(barcode)
      if (res.found) {
        const saved = { id: uid(), ...res.product }
        addFood(saved) // se guarda localmente para la próxima vez
        setProduct(saved)
      } else {
        setMissing({ barcode, partial: res.partial })
      }
    } catch (e) {
      setError(
        navigator.onLine
          ? `No se pudo consultar Open Food Facts (${e.message}). Puedes ingresarlo manualmente.`
          : 'Sin conexión: no se puede consultar Open Food Facts. Puedes ingresarlo manualmente.'
      )
      setMissing({ barcode, partial: null })
    }
    setState('idle')
  }

  const start = async () => {
    setError('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('La cámara requiere HTTPS. Abre la app desde su URL https:// (o localhost).')
      return
    }
    setState('starting')
    try {
      // Permiso explícito (debe ocurrir tras un toque del usuario, requisito de iOS)
      const probe = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      probe.getTracks().forEach((t) => t.stop())

      const scanner = new Html5Qrcode(READER_ID, { formatsToSupport: FORMATS, verbose: false, useBarCodeDetectorIfSupported: true })
      scannerRef.current = scanner
      busyRef.current = false
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (w, h) => ({ width: Math.floor(w * 0.9), height: Math.floor(Math.min(h * 0.45, w * 0.4)) }),
          // Más resolución y enfoque continuo = lectura mucho más fiable en el celular
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            advanced: [{ focusMode: 'continuous' }],
          },
        },
        async (text) => {
          if (busyRef.current) return
          busyRef.current = true
          await stop()
          setState('idle')
          lookup(text)
        },
        () => {}
      )
      // iOS Safari: el video debe ser inline y mudo para no abrirse a pantalla completa
      const v = document.querySelector(`#${READER_ID} video`)
      if (v) {
        v.setAttribute('playsinline', 'true')
        v.setAttribute('webkit-playsinline', 'true')
        v.setAttribute('muted', 'true')
        v.muted = true
      }
      setState('scanning')
    } catch (e) {
      await stop()
      setState('idle')
      const name = e?.name || ''
      if (name === 'NotAllowedError' || /permission/i.test(String(e))) {
        setError('Permiso de cámara denegado. Actívalo en Ajustes del navegador/iPhone para este sitio y vuelve a intentar.')
      } else if (name === 'NotFoundError') {
        setError('No se encontró una cámara en este dispositivo.')
      } else if (name === 'NotReadableError') {
        setError('La cámara está siendo usada por otra app. Ciérrala e intenta de nuevo.')
      } else {
        setError(`No se pudo iniciar la cámara: ${e?.message || e}`)
      }
    }
  }

  // Plan B: foto con la cámara nativa del teléfono (enfoca mejor que el video en vivo)
  const scanPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setState('loading')
    try {
      const s = new Html5Qrcode('reader-file', { formatsToSupport: FORMATS, verbose: false })
      const text = await s.scanFile(file, false)
      try { s.clear() } catch { /* noop */ }
      lookup(text)
    } catch {
      setState('idle')
      setError('No se pudo leer el código en la foto. Acércate, que el código se vea nítido y recto, y vuelve a intentar.')
    }
  }

  const cancel = async () => {
    await stop()
    setState('idle')
  }

  const record = ({ qty, meal }) => {
    addEntry(date, {
      id: uid(),
      meal,
      name: product.brand ? `${product.name} (${product.brand})` : product.name,
      qty,
      unit: 'g',
      base: { kcal: product.kcal, p: product.p, c: product.c, f: product.f },
    })
    setProduct(null)
    onDone?.()
  }

  const active = state === 'scanning' || state === 'starting'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Código de barras</h1>

      <div className="card !p-2">
        <div id={READER_ID} className={active ? 'min-h-[260px]' : ''} />
        <div id="reader-file" className="hidden" />
        {!active && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
            {state === 'loading' ? <Loader2 className="animate-spin" size={40} /> : <Camera size={40} />}
            <p className="text-sm">{state === 'loading' ? 'Buscando en Open Food Facts…' : 'Apunta la cámara trasera al código de barras'}</p>
          </div>
        )}
        {state === 'starting' && <p className="mt-2 text-center text-sm text-slate-500">Iniciando cámara…</p>}
      </div>

      {active ? (
        <button className="btn-ghost w-full" onClick={cancel}>
          <CameraOff size={20} /> Detener cámara
        </button>
      ) : (
        <button className="btn-primary w-full !py-4 text-lg" onClick={start} disabled={state === 'loading'}>
          <Camera size={22} /> Abrir cámara y escanear
        </button>
      )}

      {!active && (
        <label className="btn-ghost w-full cursor-pointer">
          <Camera size={20} /> Tomar foto del código
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={scanPhoto} />
        </label>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <div className="card">
        <p className="label flex items-center gap-1"><Keyboard size={14} /> ¿Sin cámara? Escribe el código</p>
        <div className="flex gap-2">
          <input className="input" inputMode="numeric" placeholder="Ej. 7702004003509" value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))} />
          <button className="btn-primary" disabled={manual.length < 6 || state === 'loading'} onClick={() => lookup(manual)}>
            Buscar
          </button>
        </div>
      </div>

      {product && (
        <QuantitySheet
          title={product.name}
          subtitle={product.brand}
          base={{ kcal: product.kcal, p: product.p, c: product.c, f: product.f }}
          unit="g"
          initialQty={100}
          initialMeal={meal || defaultMeal()}
          saveLabel="Registrar en el diario"
          onSave={record}
          onClose={() => setProduct(null)}
        />
      )}

      {missing && (
        <FoodForm
          title="Producto no encontrado"
          note="No encontramos este producto o le faltan datos nutricionales. Ingresa los valores de la etiqueta (por 100 g); quedará guardado en tu base local."
          initial={{ ...(missing.partial || {}), barcode: missing.barcode }}
          onClose={() => setMissing(null)}
          onSave={(food) => {
            const saved = { ...food, barcode: missing.barcode }
            addFood(saved)
            setMissing(null)
            setProduct(saved)
          }}
        />
      )}
    </div>
  )
}
