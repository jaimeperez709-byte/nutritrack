import React from 'react'
import { USERS } from '../lib/storage'

const STYLE = {
  jaime: 'bg-emerald-600',
  alejandra: 'bg-rose-500',
}

export default function UserPicker({ onPick }) {
  return (
    <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">NutriTrack</h1>
        <p className="mt-1 text-slate-500">¿Quién eres?</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-4">
        {USERS.map((u) => (
          <button
            key={u.id}
            onClick={() => onPick(u.id)}
            className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm active:scale-95 dark:border-slate-700 dark:bg-slate-800"
          >
            <span className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white ${STYLE[u.id]}`}>
              {u.name[0]}
            </span>
            <span className="text-lg font-semibold">{u.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
