import { getStore } from '@netlify/blobs'

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const sha256 = async (s) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

export default async (req) => {
  const url = new URL(req.url)
  const code = (url.searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (code.length < 20) return json({ error: 'codigo invalido' }, 400)

  const store = getStore('nutritrack-sync')
  const key = await sha256(code)

  if (req.method === 'GET') {
    const v = await store.get(key, { type: 'json' })
    return v ? json(v) : json({ error: 'no existe' }, 404)
  }
  if (req.method === 'PUT') {
    const text = await req.text()
    if (text.length > 3_000_000) return json({ error: 'demasiado grande' }, 413)
    let body
    try {
      body = JSON.parse(text)
    } catch {
      return json({ error: 'json invalido' }, 400)
    }
    if (!body || typeof body.data !== 'object' || !body.data.log) return json({ error: 'datos invalidos' }, 400)
    const t = Date.now()
    await store.setJSON(key, { data: body.data, t })
    return json({ ok: true, t })
  }
  return json({ error: 'metodo no permitido' }, 405)
}

export const config = { path: '/api/sync' }
