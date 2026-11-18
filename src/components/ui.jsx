import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { r0, r1 } from '../lib/nutrition'

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="safe-bottom flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-slate-50 shadow-xl dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}

// Input numérico: teclado decimal en iOS y Android. Guarda texto; usa num() para convertir.
export function NumField({ label, value, onChange, suffix, placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <div className="relative">
        <input
          className="input pr-12"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>}
      </div>
    </label>
  )
}

export function TextField({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <input className="input" {...props} />
    </label>
  )
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Ring({ value, goal, size = 150 }) {
  const stroke = 14
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0
  const over = goal > 0 && value > goal
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          className={`transition-all duration-500 ${over ? 'stroke-red-500' : 'stroke-brand-500'}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none">{r0(value)}</span>
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">de {r0(goal)} kcal</span>
      </div>
    </div>
  )
}

export function MacroBar({ label, value, goal, color }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {r0(value)} / {r0(goal)} g
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function MacroLine({ t, className = '' }) {
  return (
    <span className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      {r0(t.kcal)} kcal · P {r1(t.p)} · C {r1(t.c)} · G {r1(t.f)}
    </span>
  )
}

export function Empty({ children }) {
  return <p className="py-8 text-center text-sm text-slate-400">{children}</p>
}
