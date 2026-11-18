import { perPortion, r0 } from './nutrition'

// Receta → string seguro para URL (formato compacto)
export function encodeRecipe(recipe) {
  const compact = {
    n: recipe.name,
    s: recipe.portions,
    i: recipe.ingredients.map((x) => [
      x.name,
      x.grams,
      x.per100.kcal,
      x.per100.p,
      x.per100.c,
      x.per100.f,
    ]),
  }
  const json = JSON.stringify(compact)
  return encodeURIComponent(btoa(unescape(encodeURIComponent(json))))
}

export function decodeRecipe(param) {
  // URLSearchParams ya decodificó una vez el valor; por si llega sin decodificar, se intenta ambos
  let b64 = param
  if (/%[0-9A-Fa-f]{2}/.test(b64)) b64 = decodeURIComponent(b64)
  const json = decodeURIComponent(escape(atob(b64)))
  const d = JSON.parse(json)
  if (!d || !Array.isArray(d.i) || !d.n) throw new Error('Receta inválida')
  return {
    name: String(d.n),
    portions: Number(d.s) > 0 ? Number(d.s) : 1,
    ingredients: d.i.map(([name, grams, kcal, p, c, f]) => ({
      name: String(name),
      grams: Number(grams) || 0,
      per100: { kcal: Number(kcal) || 0, p: Number(p) || 0, c: Number(c) || 0, f: Number(f) || 0 },
    })),
  }
}

export function shareRecipeWhatsApp(recipe) {
  const link = `${window.location.origin}/?importRecipe=${encodeRecipe(recipe)}`
  const pp = perPortion(recipe)
  const text =
    `🥗 Te comparto mi receta "${recipe.name}" de NutriTrack\n` +
    `${r0(pp.kcal)} kcal por porción (${recipe.portions} porciones en total)\n\n` +
    `Ábrela para guardarla en tus recetas:\n${link}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}

export function readImportParam() {
  const p = new URLSearchParams(window.location.search).get('importRecipe')
  if (!p) return null
  try {
    return decodeRecipe(p)
  } catch (e) {
    console.warn('importRecipe inválido', e)
    return null
  }
}

export function clearImportParam() {
  const url = new URL(window.location.href)
  url.searchParams.delete('importRecipe')
  window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash)
}
