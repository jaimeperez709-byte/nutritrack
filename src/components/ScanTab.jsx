import React, { useState } from 'react'
import FoodCamera from './FoodCamera'
import Scanner from './Scanner'

export default function ScanTab({ profile, foods, addFood, addEntry, addEntries, date, onGoProfile, meal, onDone }) {
  const [mode, setMode] = useState('food')
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1 text-sm font-semibold dark:bg-slate-800">
        {[['food', 'Foto de comida'], ['barcode', 'Código de barras']].map(([id, l]) => (
          <button key={id} onClick={() => setMode(id)} className={`rounded-lg py-2 ${mode === id ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>
      {mode === 'food' ? (
        <FoodCamera profile={profile} date={date} addEntries={addEntries} onGoProfile={onGoProfile} meal={meal} onDone={onDone} />
      ) : (
        <Scanner foods={foods} addFood={addFood} addEntry={addEntry} date={date} meal={meal} onDone={onDone} />
      )}
    </div>
  )
}
