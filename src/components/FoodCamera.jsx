import React, { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, KeyRound } from 'lucide-react'
import AIModal from './AIModal'
import { fileToJpegBase64 } from '../lib/ai'

// Cámara en vivo: apuntas al plato, tomas la foto y la IA calcula calorías y macros.
export default function FoodCamera({ profile, date, addEntries, onGoProfile }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [shot, setShot] = useState(null) // base64 de la foto tomada
  const hasKey = !!profile.aiKey

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setReady(false)
  }

  const start = async () => {
    setError('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('La cámara requiere HTTPS. Abre la app desde su enlace https://.')
      return
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = s
      const v = videoRef.current
      if (v) {
        v.srcObject = s
        v.setAttribute('playsinline', 'true')
        v.muted = true
        await v.play().catch(() => {})
      }
      setReady(true)
    } catch (e) {
      const n = e?.name || ''
      setError(
        n === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Actívalo en Ajustes del teléfono para este sitio y vuelve a intentar.'
          : `No se pudo abrir la cámara: ${e?.message || e}`
      )
    }
  }

  useEffect(() => {
    if (hasKey && !shot) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey, shot])

  useEffect(() => () => stop(), [])

  const capture = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const k = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(v.videoWidth * k)
    c.height = Math.round(v.videoHeight * k)
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
    const b64 = c.toDataURL('image/jpeg', 0.82).split(',')[1]
    stop()
    setShot(b64)
  }

  const fromFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const b64 = await fileToJpegBase64(f)
      stop()
      setShot(b64)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!hasKey) {
    return (
      <div className="card space-y-3 text-center">
        <KeyRound className="mx-auto text-brand-600" size={36} />
        <h2 className="text-lg font-bold">Un paso antes de la primera foto</h2>
        <p className="text-sm text-slate-500">
          Para que la IA reconozca tu comida necesitas pegar una clave gratuita de Gemini en Perfil. Se consigue en <b>aistudio.google.com/apikey</b> y toma 2 minutos.
        </p>
        <button className="btn-primary w-full" onClick={onGoProfile}>Ir a Perfil y pegar la clave</button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} playsInline muted autoPlay className="aspect-[3/4] w-full object-cover" />
        {!ready && !error && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Abriendo cámara…</p>}
      </div>
      {error && (
        <div className="space-y-2">
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
          <button className="btn-ghost w-full" onClick={start}>Reintentar cámara</button>
        </div>
      )}
      <button className="btn-primary w-full !py-4 text-lg" onClick={capture} disabled={!ready}>
        <Camera size={24} /> Tomar foto y calcular
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={fromFile} />
      <button className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
        <ImagePlus size={18} /> Usar la cámara del teléfono
      </button>

      {shot && (
        <AIModal
          profile={profile}
          initialImageB64={shot}
          onClose={() => setShot(null)}
          onSave={(entries) => {
            addEntries(date, entries)
            setShot(null)
          }}
        />
      )}
    </div>
  )
}
