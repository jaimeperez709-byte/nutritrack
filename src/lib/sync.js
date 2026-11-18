// Guardado en la nube (Netlify Blobs) con un código personal. Los datos siempre se guardan primero en el teléfono.
const codeKey = (user) => `nutritrack:sync:${user}`
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
export const prettyCode = (c) => normalizeCode(c).replace(/(.{5})(?=.)/g, '$1-')
export const getCode = (user) => {
  try {
    return localStorage.getItem(codeKey(user)) || ''
  } catch {
    return ''
  }
}
export const setCode = (user, code) => {
  try {
    if (code) localStorage.setItem(codeKey(user), normalizeCode(code))
    else localStorage.removeItem(codeKey(user))
  } catch {}
}
export const newCode = () => {
  const b = new Uint8Array(20)
  crypto.getRandomValues(b)
  return prettyCode(Array.from(b, (x) => ALPHA[x % ALPHA.length]).join(''))
}

// La clave de IA nunca sube a la nube
const strip = (d) => ({ ...d, profile: { ...d.profile, aiKey: '', aiProvider: undefined, aiModel: undefined } })

export async function pull(code) {
  const res = await fetch(`/api/sync?code=${normalizeCode(code)}`, { cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`sync ${res.status}`)
  return res.json() // { data, t }
}

export async function push(code, data) {
  const res = await fetch(`/api/sync?code=${normalizeCode(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: strip(data) }),
  })
  if (!res.ok) throw new Error(`sync ${res.status}`)
  return res.json()
}

// Datos de la nube + la clave de IA que ya tenías en este teléfono
export const mergeRemote = (remote, current) => ({
  ...remote,
  profile: {
    ...remote.profile,
    aiKey: current.profile.aiKey,
    aiProvider: current.profile.aiProvider,
    aiModel: current.profile.aiModel,
  },
})
