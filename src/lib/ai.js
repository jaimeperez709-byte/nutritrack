// IA opcional con tu propia API Key (se guarda solo en localStorage y se envía únicamente al proveedor elegido).
const PROMPT = `Eres un nutricionista. Analiza la comida descrita o fotografiada y estima los alimentos consumidos.
Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown, con esta forma exacta:
{"items":[{"name":"string","grams":number,"kcal":number,"protein":number,"carbs":number,"fat":number}]}
Los valores de kcal, protein, carbs y fat son TOTALES para los gramos indicados (no por 100 g). Protein, carbs y fat en gramos. Usa nombres en español.`

export const DEFAULT_MODELS = { gemini: 'gemini-3.8-flash', anthropic: 'claude-haiku-5-5' }

// Reduce la foto para que la subida sea rápida
export function fileToJpegBase64(file, maxSide = 800) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * k)
      canvas.height = Math.round(img.height * k)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.78).split(',')[1])
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

function extractJson(text) {
  const clean = text.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error('La IA no devolvió JSON')
  const data = JSON.parse(clean.slice(start, end + 1))
  const items = Array.isArray(data.items) ? data.items : []
  return items
    .map((i) => ({
      name: String(i.name || 'Alimento'),
      grams: Number(i.grams) || 0,
      kcal: Number(i.kcal) || 0,
      p: Number(i.protein ?? i.p) || 0,
      c: Number(i.carbs ?? i.c) || 0,
      f: Number(i.fat ?? i.f) || 0,
    }))
    .filter((i) => i.name)
}

export async function analyzeMeal({ provider, apiKey, model, text, imageBase64 }) {
  const m = model || DEFAULT_MODELS[provider]
  const userText = text?.trim() ? `Comida: ${text.trim()}` : 'Analiza la comida de la foto.'

  if (provider === 'gemini') {
    const parts = [{ text: `${PROMPT}\n\n${userText}` }]
    if (imageBase64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } })
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`
    const netErr = (e) =>
      new Error(
        e?.name === 'AbortError'
          ? 'Gemini tardó demasiado en responder. Revisa tu señal e intenta de nuevo.'
          : 'No se pudo conectar con Gemini. Revisa tu conexión e intenta de nuevo.'
      )
    const call = async (generationConfig) => {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 45000)
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          signal: ctrl.signal,
          body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig }),
        })
        const json = await res.json().catch(() => ({}))
        return { res, json }
      } finally {
        clearTimeout(timer)
      }
    }
    const base = { responseMimeType: 'application/json', temperature: 0.2 }
    let r
    try {
      // Razonamiento mínimo = respuesta mucho más rápida
      r = await call({ ...base, thinkingConfig: { thinkingLevel: 'low' } })
      if (!r.res.ok && r.res.status === 400) r = await call(base)
    } catch (e) {
      // un reintento si la conexión falló
      try {
        r = await call(base)
      } catch (e2) {
        throw netErr(e2)
      }
    }
    if (!r.res.ok) throw new Error(r.json.error?.message || `Gemini respondió ${r.res.status}`)
    const out = r.json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
    return extractJson(out)
  }

  // Anthropic (llamada directa desde el navegador)
  const content = []
  if (imageBase64) {
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } })
  }
  content.push({ type: 'text', text: userText })
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: m, max_tokens: 1024, system: PROMPT, messages: [{ role: 'user', content }] }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error?.message || `Anthropic respondió ${res.status}`)
  const out = (json.content || []).map((b) => b.text || '').join('')
  return extractJson(out)
}
