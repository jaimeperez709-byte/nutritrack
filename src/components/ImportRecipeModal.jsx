import React from 'react'
import { Modal, MacroLine } from './ui'
import { perPortion, recipeTotals, r0 } from '../lib/nutrition'

export default function ImportRecipeModal({ recipe, onSave, onClose }) {
  const pp = perPortion(recipe)
  const total = recipeTotals(recipe)
  return (
    <Modal title="Receta compartida" onClose={onClose}>
      <h3 className="text-xl font-bold">{recipe.name}</h3>
      <p className="text-sm text-slate-500">{recipe.portions} porciones · lote de {r0(total.kcal)} kcal</p>

      <div className="card mt-3 text-center">
        <div className="text-xs text-slate-500">Por porción</div>
        <div className="text-3xl font-extrabold">{r0(pp.kcal)} <span className="text-base font-medium text-slate-400">kcal</span></div>
        <MacroLine t={pp} />
      </div>

      <ul className="card mt-3 divide-y divide-slate-100 !p-0 dark:divide-slate-800">
        {recipe.ingredients.map((i, idx) => (
          <li key={idx} className="flex justify-between px-4 py-2.5 text-sm">
            <span>{i.name}</span>
            <span className="text-slate-500">{i.grams} g</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={onClose}>Descartar</button>
        <button className="btn-primary" onClick={onSave}>Guardar en Mis Recetas</button>
      </div>
    </Modal>
  )
}
