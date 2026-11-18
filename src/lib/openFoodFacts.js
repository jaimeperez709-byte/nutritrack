// Devuelve { found: true, product } o { found: false, partial? }
// product: { name, brand, barcode, kcal, p, c, f }  (por 100 g)
export async function fetchProduct(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}.json?fields=product_name,product_name_es,brands,nutriments`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status === 404) return { found: false }
  if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`)
  const json = await res.json()
  if (json.status !== 1 || !json.product) return { found: false }

  const pr = json.product
  const n = pr.nutriments || {}
  const name = pr.product_name_es || pr.product_name || ''
  const brand = (pr.brands || '').split(',')[0].trim()

  let kcal = Number(n['energy-kcal_100g'])
  if (!Number.isFinite(kcal) && Number.isFinite(Number(n['energy_100g']))) {
    kcal = Number(n['energy_100g']) / 4.184 // kJ → kcal
  }
  const p = Number(n['proteins_100g'])
  const c = Number(n['carbohydrates_100g'])
  const f = Number(n['fat_100g'])

  const partial = {
    name,
    brand,
    barcode,
    kcal: Number.isFinite(kcal) ? Math.round(kcal * 10) / 10 : '',
    p: Number.isFinite(p) ? p : '',
    c: Number.isFinite(c) ? c : '',
    f: Number.isFinite(f) ? f : '',
  }
  const complete = [kcal, p, c, f].every((v) => Number.isFinite(v))
  if (!name || !complete) return { found: false, partial }
  return { found: true, product: partial }
}
